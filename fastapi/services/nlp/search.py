import numpy as np
import re
from copy import deepcopy
from dataclasses import dataclass
from typing import List, Optional, Dict, Union
import random

from elasticsearch_dsl import Q, Search
from services.service_utils import rmSpace
from services.nlp import query
from services.nlp import rag_tokenizer
from services.settings import es_logger
import json
def index_name(uid): return f"questin_{uid}"

def question_index_name(uid): return f"questin_{uid}_question"

def external_source_index_name(uid): return f"questin_{uid}_external_source"

class Dealer:
    def __init__(self, es):
        self.qryr = query.ESQueryer(es)
        self.qryr.flds = [
            "title_tks^10",
            "title_sm_tks^5",
            "important_kwd^30",
            "important_tks^20",
            "content_ltks^5",
            "content_sm_ltks^3",
            "ask_tks^10", 
            "ask_small_tks"]
        self.es = es
    
    @dataclass
    class SearchResult:
        total: int
        ids: List[str]
        query_vector: List[float] = None
        field: Optional[Dict] = None
        highlight: Optional[Dict] = None
        aggregation: Union[List, Dict, None] = None
        keywords: Optional[List[str]] = None
        group_docs: List[List] = None
    
    def _vector(self, txt, emb_mdl, sim=0.8, topk=10):
        qv, c = emb_mdl.encode_queries(txt)
        return {
            "field": "q_%d_vec" % len(qv),
            "k": topk,
            "similarity": sim,
            "num_candidates": topk * 2,
            "query_vector": [float(v) for v in qv],
            "boost": 2
        }
    
    def _add_filters(self, bqry, req):
        if req.get("kb_ids"):
            bqry.filter.append(Q("terms", kb_id=req["kb_ids"]))
        if req.get("doc_ids"):
            bqry.filter.append(Q("terms", doc_id=req["doc_ids"]))
        if req.get("knowledge_graph_kwd"):
            bqry.filter.append(Q("terms", knowledge_graph_kwd=req["knowledge_graph_kwd"]))
        if "available_int" in req:
            if req["available_int"] == 0:
                bqry.filter.append(Q("range"), available_int={"lt": 1})
            else:
                bqry.filter.append(
                    Q("bool", must_not=Q("range", available_int={"lt": 1})))
        return bqry
        
    def search(self, req, idxnm, emb_mdl=None, highlight=False):
        qst = req.get("question", "")
        bqry, keywords = self.qryr.question(qst, min_match="30%")
        bqry = self._add_filters(bqry, req)
        bqry.boost = 0.05
        
        s = Search()
        pg = int(req.get("page", 1)) - 1
        topk = int(req.get("topk", 1024))
        ps = int(req.get("size", topk))
        src = req.get("fields", ["docnm_kwd", "content_ltks", "kb_id", "img_id", "title_tks", "title_kwd", "important_kwd",
                                 "image_id", "doc_id", "q_512_vec", "q_768_vec", "position_int", "knowledge_graph_kwd",
                                 "q_1024_vec", "q_1536_vec", "available_int", "content_with_weight", "field_maps_tks", "sheetname_id"])
        s = s.query(bqry)[pg * ps:(pg + 1) * ps]
        s = s.highlight("content_ltks")
        s = s.highlight("title_ltks")
        if not qst:
            if not req.get("sort"):
                s = s.sort(
                    {"create_timestamp_flt": {
                        "order": "desc", "unmapped_type": "float"
                    }}
                )
            else:
                s = s.sort(
                    {"page_num_int": {"order": "asc", "unmapped_type": "float",
                                      "mode": "avg", "numeric_type": "double"}},
                    {"top_int": {"order": "asc", "unmapped_type": "float",
                                 "mode": "avg", "numeric_type": "double"}},
                    #{"create_time": {"order": "desc", "unmapped_type": "date"}},
                    {"create_timestamp_flt": {
                        "order": "desc", "unmapped_type": "float"}}
                )
        if qst:
            s = s.highlight_options(
                fragment_size=120,
                number_of_fragments=5,
                boundary_scanner_locale="vi-VN",
                boundary_scanner="SENTENCE",
                boundary_chars=",.;:!()[]{}\"\'–—"
            )
        s = s.to_dict()
        q_vec = []
        if req.get("vector"):
            assert emb_mdl, "No embedding model selected"
            s["knn"] = self._vector(
                qst, emb_mdl, req.get("similarity", 0.1), topk
            )
            s["knn"]["filter"] = bqry.to_dict()
            s["knn"]["boost"] = 0.7
            if not highlight and "highlight" in s:
                del s["highlight"]
            q_vec = s["knn"]["query_vector"]
        res = self.es.search(deepcopy(s), idxnm=idxnm, timeout="60s", src=src)
        es_logger.info("TOTAL: {}".format(self.es.getTotal(res)))
        if self.es.getTotal(res) == 0 and "knn" in s:
            bqry, _ = self.qryr.question(qst, min_match="10%")
            if req.get("doc_ids"):
                bqry = Q("bool", must=[])
            bqry = self._add_filters(bqry, req)
            s["query"] = bqry.to_dict()
            s["knn"]["filter"] = bqry.to_dict()
            s["knn"]["similarity"] = 0.17
            
            res = self.es.search(s, idxnm=idxnm, timeout="60s", src=src)
        
        kwds = set([])
        for k in keywords:
            kwds.add(k)
            for kk in rag_tokenizer.fine_grained_tokenize(k).split(" "):
                if len(kk) < 2:
                    continue
                if kk in kwds:
                    continue
                kwds.add(kk)
        
        aggs = self.getAggregation(res, "docnm_kwd")
        
        return self.SearchResult(
            total=self.es.getTotal(res),
            ids=self.es.getDocIds(res),
            query_vector=q_vec,
            aggregation=aggs,
            highlight=self.getHighlight(res, keywords, "content_with_weight"),
            field=self.getFields(res, src),
            keywords=list(kwds)
        )
        
    def get_random(self, req, idxnm, emb_mdl=None):
        # bqry = Q("function_score", random_score={"seed": "1477072619038"})
        bqry = Q("bool", must=[Q("match_all")])
        bqry = self._add_filters(bqry, req)
        src = req.get("fields", ["content_with_weight", "chunk_id"])
        s = Search()
        pg = int(req.get("page", 1)) - 1
        ps = int(req.get("size", 10))
        s = s.query(bqry)[pg * ps:(pg + 1) * ps]
        s = s.to_dict()
        
        res = self.es.search(deepcopy(s), idxnm=idxnm, timeout="60s", src=src)
                
        return self.SearchResult(
            total=self.es.getTotal(res),
            ids=self.es.getDocIds(res),
            query_vector=None,
            aggregation=None,
            highlight=None,
            field=self.getFields(res, src),
            keywords=None
        )
    def getAggregation(self, res, g):
        if not "aggregations" in res or "aggs_" + g not in res["aggregations"]:
            return
        bkts = res["aggregations"]["aggs_" + g]["buckets"]
        return [(b["key"], b["doc_count"]) for b in bkts]
          
    def getHighlight(self, res, keywords, fieldnm):
        ans = {}
        for d in res["hits"]["hits"]:
            hlts = d.get("highlight")
            if not hlts:
                continue
            txt = "...".join([a for a in list(hlts.items())[0][1]])

            txt = d["_source"][fieldnm]
            txt = re.sub(r"[\r\n]", " ", txt, flags=re.IGNORECASE|re.MULTILINE)
            txts = []
            for t in re.split(r"[.?!;\n]", txt):
                for w in keywords:
                    t = re.sub(r"(^|[ .?/'\"\(\)!,:;-])(%s)([ .?/'\"\(\)!,:;-])"%re.escape(w), r"\1<em>\2</em>\3", t, flags=re.IGNORECASE|re.MULTILINE)
                if not re.search(r"<em>[^<>]+</em>", t, flags=re.IGNORECASE|re.MULTILINE): continue
                txts.append(t)
            ans[d["_id"]] = "...".join(txts) if txts else "...".join([a for a in list(hlts.items())[0][1]])

        return ans
    
    def getFields(self, sres, flds):
        res = {}
        if not flds:
            return {}
        for d in self.es.getSource(sres):
            m = {n: d.get(n) for n in flds if d.get(n) is not None}
            for n, v in m.items():
                if isinstance(v, type([])):
                    m[n] = "\t".join([str(vv) if not isinstance(
                        vv, list) else "\t".join([str(vvv) for vvv in vv]) for vv in v])
                    continue
                if not isinstance(v, type("")):
                    m[n] = str(m[n])
                if n.find("tks") > 0:
                    m[n] = rmSpace(m[n])

            if m:
                res[d["id"]] = m
        return res
    
    @staticmethod
    def trans2floats(txt):
        return [float(t) for t in txt.split("\t")]
    
    def insert_citations(self, answer, chunks, chunk_v,
                         embd_mdl, tkweight=0.1, vtweight=0.9):
        assert len(chunks) == len(chunk_v)
        if not chunks:
            return answer, set([])
        pieces = re.split(r"(```)", answer)
        if len(pieces) >= 3:
            i = 0
            pieces_ = []
            while i < len(pieces):
                if pieces[i] == "```":
                    st = i
                    i += 1
                    while i < len(pieces) and pieces[i] != "```":
                        i += 1
                    if i < len(pieces):
                        i += 1
                    pieces_.append("".join(pieces[st: i]) + "\n")
                else:
                    pieces_.extend(
                        re.split(
                            r"([^\|][；。？!！\n]|[a-z][.?;!][ \n])",
                            pieces[i]))
                    i += 1
            pieces = pieces_
        else:
            pieces = re.split(r"([^\|][；。？!！\n]|[a-z][.?;!][ \n])", answer)
        for i in range(1, len(pieces)):
            if re.match(r"([^\|][；。？!！\n]|[a-z][.?;!][ \n])", pieces[i]):
                pieces[i - 1] += pieces[i][0]
                pieces[i] = pieces[i][1:]
        idx = []
        pieces_ = []
        for i, t in enumerate(pieces):
            if len(t) < 5:
                continue
            idx.append(i)
            pieces_.append(t)
        es_logger.info("{} => {}".format(answer, pieces_))
        if not pieces_:
            return answer, set([])

        ans_v, _ = embd_mdl.encode(pieces_)
        assert len(ans_v[0]) == len(chunk_v[0]), "The dimension of query and chunk do not match: {} vs. {}".format(
                len(ans_v[0]), len(chunk_v[0]))

        chunks_tks = [rag_tokenizer.tokenize(self.qryr.rmWWW(ck)).split(" ")
                      for ck in chunks]
        cites = {}
        thr = 0.63
        while thr>0.3 and len(cites.keys()) == 0 and pieces_ and chunks_tks:
            for i, a in enumerate(pieces_):
                sim, tksim, vtsim = self.qryr.hybrid_similarity(ans_v[i],
                                                                chunk_v,
                                                                rag_tokenizer.tokenize(
                                                                    self.qryr.rmWWW(pieces_[i])).split(" "),
                                                                chunks_tks,
                                                                tkweight, vtweight)
                mx = np.max(sim) * 0.99
                es_logger.info("{} SIM: {}".format(pieces_[i], mx))
                if mx < thr:
                    continue
                cites[idx[i]] = list(
                    set([str(ii) for ii in range(len(chunk_v)) if sim[ii] > mx]))[:4]
            thr *= 0.8

        res = ""
        seted = set([])
        for i, p in enumerate(pieces):
            res += p
            if i not in idx:
                continue
            if i not in cites:
                continue
            for c in cites[i]:
                assert int(c) < len(chunk_v)
            for c in cites[i]:
                if c in seted:
                    continue
                res += f" ##{c}$$"
                seted.add(c)

        return res, seted    

    def rerank(self, sres, query, tkweight=0.3,
               vtweight=0.7, cfield="content_ltks"):
        _, keywords = self.qryr.question(query)
        ins_embd = [
            Dealer.trans2floats(
                sres.field[i].get("q_%d_vec" % len(sres.query_vector), "\t".join(["0"] * len(sres.query_vector)))) for i in sres.ids]
        if not ins_embd:
            return [], [], []

        for i in sres.ids:
            if isinstance(sres.field[i].get("important_kwd", []), str):
                sres.field[i]["important_kwd"] = [sres.field[i]["important_kwd"]]
        ins_tw = []
        for i in sres.ids:
            content_ltks = sres.field[i][cfield].split(" ")
            title_tks = [t for t in sres.field[i].get("title_tks", "").split(" ") if t]
            important_kwd = sres.field[i].get("important_kwd", [])
            tks = content_ltks + title_tks + important_kwd
            ins_tw.append(tks)

        sim, tksim, vtsim = self.qryr.hybrid_similarity(sres.query_vector,
                                                        ins_embd,
                                                        keywords,
                                                        ins_tw, tkweight, vtweight)
        return sim, tksim, vtsim

    def manual_rerank(self, dialog_id, docs, query, tkweight=0.3,
                      vtweight=0.7):
        from db.db_services.knowledgebase_service import KnowledgebaseService
        from db.db_services.dialog_service import DialogService
        from db.db_services.llm_service import LLMBundle
        from db.constants import LLMType
        _, keywords = self.qryr.question(query)
        e, dialog = DialogService.get_by_id(dialog_id)
        if not e:
            return []
        kbs = KnowledgebaseService.get_by_ids(dialog.kb_ids)
        embd_nms = list(set([kb.embd_id for kb in kbs]))
        if len(embd_nms) != 1:
            raise ValueError("The number of embd_nms is not 1")
        embd_mdl = LLMBundle(dialog.tenant_id, LLMType.EMBEDDING, embd_nms[0])
        ins_tw = []
        ins_embd = []
        for i in range(len(docs)):
            content = docs[i]
            content_vector, c= embd_mdl.encode_queries(content)
            ins_embd.append(content_vector)
            embd_nms.append(content_vector)
            content_ltks = rag_tokenizer.tokenize(content).split(" ")
            tks = content_ltks
            ins_tw.append(tks)
        query_vector, c = embd_mdl.encode_queries(query)
        
        sim, tksim, vtsim = self.qryr.hybrid_similarity(query_vector,
                                                        ins_embd,
                                                        keywords,
                                                        ins_tw, tkweight, vtweight)
        return sim, tksim, vtsim
    
    def manual_rerank_by_model(self, rerank_mdl, docs, query, tkweight=0.3,
                               vtweight=0.7):
        _, keywords = self.qryr.question(query)
        ins_tw = []
        for doc in docs:
            tks = rag_tokenizer.tokenize(doc).split(" ")
            ins_tw.append(tks)
        tksim = self.qryr.token_similarity(keywords, ins_tw)
        vtsim, _ = rerank_mdl.similarity(query, docs)
        return tkweight * np.array(tksim) + vtweight * vtsim, tksim, vtsim
    
    def rerank_by_model(self, rerank_mdl, sres, query, tkweight=0.3,
               vtweight=0.7, cfield="content_ltks"):
        _, keywords = self.qryr.question(query)

        for i in sres.ids:
            if isinstance(sres.field[i].get("important_kwd", []), str):
                sres.field[i]["important_kwd"] = [sres.field[i]["important_kwd"]]
        ins_tw = []
        for i in sres.ids:
            content_ltks = sres.field[i][cfield].split(" ")
            title_tks = [t for t in sres.field[i].get("title_tks", "").split(" ") if t]
            important_kwd = sres.field[i].get("important_kwd", [])
            tks = content_ltks + title_tks + important_kwd
            ins_tw.append(tks)

        tksim = self.qryr.token_similarity(keywords, ins_tw)
        vtsim,_ = rerank_mdl.similarity(query, [rmSpace(" ".join(tks)) for tks in ins_tw])

        return tkweight*np.array(tksim) + vtweight*vtsim, tksim, vtsim

    def hybrid_similarity(self, ans_embd, ins_embd, ans, inst):
        return self.qryr.hybrid_similarity(ans_embd,
                                           ins_embd,
                                           rag_tokenizer.tokenize(ans).split(" "),
                                           rag_tokenizer.tokenize(inst).split(" "))
    
    def retrieval(self, question, embd_mdl, tenant_id, kb_ids, page, page_size, similarity_threshold=0.2,
                  vector_similarity_weight=0.7, top=1024, doc_ids=None, aggs=True, rerank_mdl=None, highlight=False, external_source=False):
        ranks = {"total": 0, "chunks": [], "doc_aggs": {}}
        if not question:
            return ranks
        RERANK_PAGE_LIMIT = 3
        req = {"kb_ids": kb_ids, "doc_ids": doc_ids, "size": max(page_size*RERANK_PAGE_LIMIT, 128),
               "question": question, "vector": True, "topk": top,
               "similarity": similarity_threshold,
               "available_int": 1}
        if page > RERANK_PAGE_LIMIT:
            req["page"] = page
            req["size"] = page_size
        try:
            if external_source:
                sres = self.search(req, external_source_index_name(tenant_id), embd_mdl, highlight)
            else:
                sres = self.search(req, index_name(tenant_id), embd_mdl, highlight)
        except Exception as e:
            return ranks
        ranks["total"] = sres.total
        if page <= RERANK_PAGE_LIMIT:
            if rerank_mdl:
                sim, tsim, vsim = self.rerank_by_model(rerank_mdl,
                    sres, question, 1 - vector_similarity_weight, vector_similarity_weight)
            else:
                sim, tsim, vsim = self.rerank(
                    sres, question, 1 - vector_similarity_weight, vector_similarity_weight)
            idx = np.argsort(sim * -1)[(page-1)*page_size:page*page_size]
        else:
            sim = tsim = vsim = [1]*len(sres.ids)
            idx = list(range(len(sres.ids)))
            
        dim = len(sres.query_vector)
        for i in idx:
            if sim[i] < similarity_threshold:
                break
            if len(ranks["chunks"]) >= page_size:
                if aggs:
                    continue
                break
            id = sres.ids[i]
            dnm = sres.field[id]["docnm_kwd"]
            did = sres.field[id]["doc_id"]
            field_maps_tks = sres.field[id].get("field_maps_tks", None)
            d = {
                "chunk_id": id,
                "content_ltks": sres.field[id]["content_ltks"],
                "content_with_weight": sres.field[id]["content_with_weight"],
                "field_maps_tks": json.loads(field_maps_tks) if field_maps_tks else None,
                "sheetname_id": sres.field[id].get("sheetname_id", None),
                "doc_id": sres.field[id]["doc_id"],
                "docnm_kwd": dnm,
                "title_kwd": sres.field[id].get("title_kwd", ""),
                "kb_id": sres.field[id]["kb_id"],
                "important_kwd": sres.field[id].get("important_kwd", []),
                "img_id": sres.field[id].get("img_id", ""),
                "similarity": sim[i],
                "vector_similarity": vsim[i],
                "term_similarity": tsim[i],
                "vector": self.trans2floats(sres.field[id].get("q_%d_vec" % dim, "\t".join(["0"] * dim))),
                "positions": sres.field[id].get("position_int", "").split("\t")
            }
            if highlight:
                if id in sres.highlight:
                    d["highlight"] = rmSpace(sres.highlight[id])
                else:
                    d["highlight"] = d["content_with_weight"]
            if len(d["positions"]) % 5 == 0:
                poss = []
                for i in range(0, len(d["positions"]), 5):
                    poss.append([float(d["positions"][i]), float(d["positions"][i + 1]), float(d["positions"][i + 2]),
                                 float(d["positions"][i + 3]), float(d["positions"][i + 4])])
                d["positions"] = poss
            ranks["chunks"].append(d)
            if dnm not in ranks["doc_aggs"]:
                ranks["doc_aggs"][dnm] = {"doc_id": did, "count": 0}
            ranks["doc_aggs"][dnm]["count"] += 1
        ranks["doc_aggs"] = [{"doc_name": k,
                              "doc_id": v["doc_id"],
                              "count": v["count"]} for k,
                             v in sorted(ranks["doc_aggs"].items(),
                                         key=lambda x:x[1]["count"] * -1)]

        return ranks
    
    def sql_retrieval(self, sql, fetch_size=128, format="json"):
        sql = re.sub(r"[ `]+", " ", sql)
        sql = sql.replace("%", "")
        es_logger.info(f"Get es sql: {sql}")
        replaces = []
        for r in re.finditer(r" ([a-z_]+_l?tks)( like | ?= ?)'([^']+)'", sql):
            fld, v = r.group(1), r.group(3)
            match = " MATCH({}, '{}', 'operator=OR;minimum_should_match=30%') ".format(
                fld, rag_tokenizer.fine_grained_tokenize(rag_tokenizer.tokenize(v)))
            replaces.append(
                ("{}{}'{}'".format(
                    r.group(1),
                    r.group(2),
                    r.group(3)),
                    match))

        for p, r in replaces:
            sql = sql.replace(p, r, 1)

        try:
            tbl = self.es.sql(sql, fetch_size, format)
            return tbl
        except Exception as e:
            es_logger.error(f"SQL Failure: {sql} =>" + str(e))
            return {"error": str(e)}

    def chunk_list(self, doc_id, tenant_id, max_count=1024, fields=["docnm_kwd", "content_with_weight", "img_id"]):
        s = Search()
        s = s.query(Q("match", doc_id=doc_id))[0:max_count]
        s = s.to_dict()
        es_res = self.es.search(s, idxnm=index_name(tenant_id), timeout="600s", src=fields)
        res = []
        for index, chunk in enumerate(es_res['hits']['hits']):
            res.append({fld: chunk['_source'].get(fld) for fld in fields})
        return res

if __name__ == "__main__":
    from db.db_services.llm_service import LLMBundle
    from db.constants import LLMType
    from db.db_services.dialog_service import DialogService
    from db.db_services.knowledgebase_service import KnowledgebaseService
    from db.settings import retrievaler
    question = input("Question:")
    dialog_id = "3e2c6ddad0ef11efb8d40242ac120006"
    e, dialog = DialogService.get_by_id(dialog_id)
    kbs = KnowledgebaseService.get_by_ids(dialog.kb_ids)
    embd_nms = list(set([kb.embd_id for kb in kbs]))
    embd_mdl = LLMBundle(dialog.tenant_id, LLMType.EMBEDDING, embd_nms[0])
    retr = retrievaler
    infos = retr.retrieval(question, embd_mdl, dialog.tenant_id, dialog.kb_ids, 1, 30,
                                 similarity_threshold=0.1, vector_similarity_weight=0.7,
                                 doc_ids=None, top=dialog.top_k, aggs=False, rerank_mdl=None)
    print(len(infos["chunks"]))
    with open("./tmp.json", "w", encoding="utf-8") as file:
        file.write(json.dumps([ck["content_with_weight"] for ck in infos["chunks"]], ensure_ascii=False))
    for idx, ck in enumerate(infos["chunks"]):
        print(idx, ck["content_with_weight"])
        print("-------------------")