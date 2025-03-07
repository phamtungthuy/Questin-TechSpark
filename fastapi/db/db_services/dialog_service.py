import binascii
import os
from copy import deepcopy
import json
import re
from timeit import default_timer as timer

from db.conn import DB
from db.models.dialog_models import Dialog
from db.db_services.common_service import CommonService
from db.db_services.llm_service import LLMService, TenantLLMService, LLMBundle
from db.db_services.knowledgebase_service import KnowledgebaseService
from db.db_services.document_service import DocumentService
from db.constants import StatusEnum, LLMType, ParserType
from db.settings import retrievaler, chat_logger, get_project_base_directory
from services.service_utils import num_tokens_from_string, encoder
from services.nlp.search import index_name
from services.service_utils import rmSpace

class DialogService(CommonService):
    model = Dialog
    
    @classmethod
    @DB.connection_context()
    def get_list(cls, tenant_id,
                page_number, items_per_page, orderby, desc, id, name):
        chats = cls.model.select()
        if id:
            chats = chats.where(cls.model.id == id)
        if name:
            chats = chats.where(cls.model.name == name)
        chats = chats.where(
            (cls.model.tenant_id == tenant_id)
            & (cls.model.status == StatusEnum.VALID.value)
        )
        if desc:
            chats = chats.order_by(cls.model.getter_by(orderby).desc())
        else:
            chats = chats.order_by(cls.model.getter_by(orderby).asc())
        
        chats = chats.paginate(page_number, items_per_page)
        
        return list(chats.dicts())
    

def message_fit_in(msg, max_length=4000):
    def count():
        nonlocal msg
        tks_cnts = []
        for m in msg:
            tks_cnts.append(
                {"role": m["role"], "count": num_tokens_from_string(m["content"])})
        total = 0
        for m in tks_cnts:
            total += m["count"]
        return total

    c = count()
    if c < max_length:
        return c, msg

    msg_ = [m for m in msg[:-1] if m["role"] == "system"]
    msg_.append(msg[-1])
    msg = msg_
    c = count()
    if c < max_length:
        return c, msg

    ll = num_tokens_from_string(msg_[0]["content"])
    l = num_tokens_from_string(msg_[-1]["content"])
    if ll / (ll + l) > 0.8:
        m = msg_[0]["content"]
        m = encoder.decode(encoder.encode(m)[:max_length - l])
        msg[0]["content"] = m
        return max_length, msg

    m = msg_[1]["content"]
    m = encoder.decode(encoder.encode(m)[:max_length - l])
    msg[1]["content"] = m
    return max_length, msg

def chat(dialog, messages, stream=True, **kwargs):
    assert messages[-1]["role"] == "user", "The last content of this conversation is nor from user."
    st = timer()
    tmp = dialog.llm_id.split("@")
    fid = None
    llm_id = tmp[0]
    if len(tmp) > 1: fid = tmp[1]
    
    llm = LLMService.query(llm_name=llm_id) if not fid else LLMService.query(llm_name=llm_id, fid=fid)
    if not llm:
        llm = TenantLLMService.query(tenant_id=dialog.tenant_id, llm_name=llm_id) if not fid else \
            TenantLLMService.query(tenant_id=dialog.tenant_id, llm_name=llm_id, llm_factory=fid)
        if not llm:
            raise LookupError("LLM(%s) not found" % dialog.llm_id)
        max_tokens = 8192
    else:
        max_tokens = llm[0].max_tokens
        
    kbs = KnowledgebaseService.get_by_ids(dialog.kb_ids)
    embd_nms = list(set([kb.embd_id for kb in kbs]))
    if len(embd_nms) != 1:
        yield {"answer": "**ERROR**: Knowledge bases use different embedding models.", "reference": []}
        return {"answer": "**ERROR**: Knowledge bases use different embedding models.", "reference": []}
    is_kb = all([kb.parser_id == ParserType.KG for kb in kbs])
    retr = retrievaler
    
    questions = [m["content"] for m in messages if m["role"] == "user"][-3:]
    attachments = kwargs["doc_ids"].split(",") if "doc_ids" in kwargs else None
    if "doc_ids" in messages[-1]:
        attachments = messages[-1]["doc_ids"]
        for m in messages[:-1]:
            if "doc_ids" in m:
                attachments.extend(m["doc_ids"])
                
    embd_mdl = LLMBundle(dialog.tenant_id, LLMType.EMBEDDING, embd_nms[0])
    if llm_id2llm_type(dialog.llm_id) == "image2text":
        chat_mdl = LLMBundle(dialog.tenant_id, LLMType.IMAGE2TEXT, dialog.llm_id)
    else:
        chat_mdl = LLMBundle(dialog.tenant_id, LLMType.CHAT, dialog.llm_id)
    
    prompt_config = dialog.prompt_config
    # field_map = KnowledgebaseService.get_field_map(dialog.kb_ids)
    tts_mdl = None
    if prompt_config.get("tts"):
        tts_model = LLMBundle(dialog.tenant_id, LLMType.TTS)

    
    for p in prompt_config["parameters"]:
        if p["key"] == "knowledge":
            continue
        if p["key"] not in kwargs and not p["optional"]:
            raise KeyError("Miss parameter: " + p["key"])
        if p["key"] not in kwargs:
            prompt_config["system"] = prompt_config["system"].replace(
                "{%s}" % p["key"], " ")
            
    if len(questions) > 1 and prompt_config.get("refine_multiturn"):
        questions = [full_question(dialog.tenant_id, dialog.llm_id, messages)]
    else:
        questions = questions[-1:]

    rerank_mdl=None
    if dialog.rerank_id:
        rerank_mdl = LLMBundle(dialog.tenant_id, LLMType.RERANK, dialog.rerank_id)
        
    if "knowledge" not in [p["key"] for p in prompt_config["parameters"]]:
        kbinfos = {"total": 0, "chunks": [], "doc_aggs": []}
    for _ in range(len(questions) // 2):
        questions.append(questions[-1])

    if "knowledge" not in [p["key"] for p in prompt_config["parameters"]]:
        kbinfos = {"total": 0, "chunks": [], "doc_aggs": []}
    else:
        if prompt_config.get("keyword", False):
            questions[-1] += keyword_extraction(chat_mdl, questions[-1])
        kbinfos = retr.retrieval(" ".join(questions), embd_mdl, dialog.tenant_id, dialog.kb_ids, 1, dialog.top_n,
                                        dialog.similarity_threshold,
                                        dialog.vector_similarity_weight,
                                        doc_ids=attachments,
                                        top=dialog.top_k, aggs=False, rerank_mdl=rerank_mdl)
        
    knowledges = [ck["content_with_weight"] for ck in kbinfos["chunks"]]
    chat_logger.info(
        "{}->{}".format(" ".join(questions), "\n->".join(knowledges)))
    retrieval_tm = timer()
    
    if not knowledges and prompt_config.get("empty_response"):
        empty_res = prompt_config["empty_response"]
        yield {"answer": empty_res, "reference": kbinfos}
        return {"answer": prompt_config["empty_response"], "reference": kbinfos}
    
    kwargs["knowledge"] = "\n\n------\n\n".join(knowledges)
    gen_conf = dialog.llm_setting
    
    msg = [{"role": "system", "content": prompt_config["system"].format(**kwargs)}]
    msg.extend([{"role": m["role"], "content": re.sub(r"##\d+\$\$", "", m["content"])}
                for m in messages if m["role"] != "system"])
    used_token_count, msg = message_fit_in(msg, int(max_tokens * 0.97))
    assert len(msg) >= 2, f"message_fit_in has bug: {msg}"
    prompt = msg[0]["content"]
    prompt += "\n\n### Câu hỏi:\n%s" % " ".join(questions)
    
    if "max_tokens" in gen_conf:
        gen_conf["max_tokens"] = min(gen_conf["max_tokens"],
                                     max_tokens - used_token_count)
    def decorate_answer(answer):
        nonlocal prompt_config, knowledges, kwargs, kbinfos, prompt, retrieval_tm
        refs = []
        if knowledges and (prompt_config.get("quote", True) and kwargs.get("quote", True)):
            answer, idx = retr.insert_citations(answer,
                                                       [ck["content_ltks"]
                                                        for ck in kbinfos["chunks"]],
                                                       [ck["vector"]
                                                        for ck in kbinfos["chunks"]],
                                                       embd_mdl,
                                                       tkweight=1 - dialog.vector_similarity_weight,
                                                       vtweight=dialog.vector_similarity_weight)
            idx = set([kbinfos["chunks"][int(i)]["doc_id"] for i in idx])
            recall_docs = [
                d for d in kbinfos["doc_aggs"] if d["doc_id"] in idx]
            if not recall_docs: recall_docs = kbinfos["doc_aggs"]
            kbinfos["doc_aggs"] = recall_docs

            refs = deepcopy(kbinfos)
            for c in refs["chunks"]:
                if c.get("vector"):
                    del c["vector"]

        if answer.lower().find("invalid key") >= 0 or answer.lower().find("invalid api") >= 0:
            answer += " Please set LLM API-Key in 'User Setting -> Model Providers -> API-Key'"
        done_tm = timer()
        prompt += "\n\n### Elapsed\n  - Retrieval: %.1f ms\n  - LLM: %.1f ms"%((retrieval_tm-st)*1000, (done_tm-st)*1000)
        return {"answer": answer, "reference": refs, "prompt": prompt}
    
    if stream:
        last_ans = ""
        answer = ""
        for ans in chat_mdl.chat_streamly(prompt, msg[1:], gen_conf):
            answer = ans
            delta_ans = ans[len(last_ans):]
            if num_tokens_from_string(delta_ans) < 16:
                continue
            last_ans = answer
            yield {"answer": answer, "reference": {}, "audio_binary": tts(tts_mdl, delta_ans)}
        delta_ans = answer[len(last_ans):]
        if delta_ans:
            yield {"answer": answer, "reference": {}, "audio_binary": tts(tts_mdl, delta_ans)}
        yield decorate_answer(answer)
    else:    
        answer = chat_mdl.chat(prompt, msg[1:], gen_conf)
        chat_logger.info("User: {}|Assistant: {}".format(
            msg[-1]["content"], answer))
        res = decorate_answer(answer)
        res["audio_binary"] = tts(tts_mdl, answer)
        yield res

def chat_sql(dialog, question, **kwargs):
    kbs = KnowledgebaseService.get_by_ids(dialog.kb_ids)
    embd_nms = list(set([kb.embd_id for kb in kbs]))
    if len(embd_nms) != 1:
        yield {"answer": "**ERROR**: Knowledge bases use different embedding models.", "reference": []}
        return {"answer": "**ERROR**: Knowledge bases use different embedding models.", "reference": []}
    embd_mdl = LLMBundle(dialog.tenant_id, LLMType.EMBEDDING, embd_nms[0])
    if llm_id2llm_type(dialog.llm_id) == "image2text":
        chat_mdl = LLMBundle(dialog.tenant_id, LLMType.IMAGE2TEXT, dialog.llm_id)
    else:
        chat_mdl = LLMBundle(dialog.tenant_id, LLMType.CHAT, dialog.llm_id)
    prompt_config = dialog.prompt_config
    retr = retrievaler
    gso_doc_ids = []
    for kb in kbs:
        gso_docs = DocumentService.query(kb_id=kb.id, parser_id=ParserType.GSO)
        gso_doc_ids.extend([doc.id for doc in gso_docs])
    if len(gso_doc_ids) > 0:
        gso_kbinfos = retr.retrieval(question, embd_mdl, dialog.tenant_id, dialog.kb_ids, 1, dialog.top_n,
                                 similarity_threshold=0.2, vector_similarity_weight=dialog.vector_similarity_weight,
                                 doc_ids=gso_doc_ids, top=dialog.top_k, aggs=False, rerank_mdl=None)
        if len(gso_kbinfos["chunks"]) > 0:
            field_map = gso_kbinfos["chunks"][0]["field_maps_tks"]
            sheetname_id = gso_kbinfos["chunks"][0]["sheetname_id"]
            if field_map and sheetname_id:

                chat_logger.info("Use SQL to retrieval:{}".format(question))
                try:
                    ans = use_sql(question, gso_doc_ids, sheetname_id, field_map, dialog.tenant_id, chat_mdl, prompt_config.get("quote", True))
                    if ans:
                        yield ans
                except Exception as e:
                    chat_logger.error("Use SQL to retrieval error:{}".format(e))
    yield None

def use_sql(question, doc_ids, sheetname_id, field_map, tenant_id, chat_mdl, quota=True):
    sys_prompt = "You are a DBA. You need to create the SQL for the last question in the user's question list based on the structure of the fields in the following tables."
    user_prompt = """
    Table name: {};
    Database table field descriptions are as follows:
    {}

    The questions are:
    {}
    Important notes:
    1. Please write the SQL, and provide only the SQL without any additional explanations or text.
    2. Avoid using the `ilike` operator as it is not supported. Instead, use `LOWER(column_name) LIKE '...'` for case-insensitive matching.
    3. Ensure the SQL query is syntactically correct for the specified database.
    4. And you have where condition which doc_id field in {} and sheetname_id field in {} 
    5. Please write the SQL, and provide only the SQL without any additional explanations or text.
    6. write basic SQL for elasticsearch because Elasticsearch's SQL support is not as comprehensive as relational databases, only supporting: SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT/TOP, PIVOT
    Please write the SQL.

    """.format(
            index_name(tenant_id),
            "\n".join([f"{k}: {v}" for k, v in field_map.items()]),
            question,
            doc_ids,
            sheetname_id
        )
    tried_times = 0
    def get_table():
        nonlocal sys_prompt, user_prompt, question, tried_times
        sql = chat_mdl.chat(sys_prompt, [{"role": "user", "content": user_prompt}], {
            "temperature": 0.06})
        print(user_prompt, sql)
        chat_logger.info(f"“{question}”==>{user_prompt} get SQL: {sql}")
        sql = re.sub(r"[\r\n]+", " ", sql.lower())
        sql = re.sub(r".*select ", "select ", sql.lower())
        sql = re.sub(r" +", " ", sql)
        sql = re.sub(r"([;；]|```).*", "", sql)
        if sql[:len("select ")] != "select ":
            return None, None
        if not re.search(r"((sum|avg|max|min)\(|group by )", sql.lower()):
            if sql[:len("select *")] != "select *":
                sql = "select doc_id,docnm_kwd," + sql[6:]
            else:
                flds = []
                for k in field_map.keys():
                    if len(flds) > 11:
                        break
                    flds.append(k)
                sql = "select doc_id,docnm_kwd," + ",".join(flds) + sql[8:]

        print(f"“{question}” get SQL(refined): {sql}")

        chat_logger.info(f"“{question}” get SQL(refined): {sql}")
        tried_times += 1
        return retrievaler.sql_retrieval(sql, format="json"), sql
    
    tbl, sql = get_table()
    if tbl is None:
        return None
    if tbl.get("error") and tried_times <= 2:
        return None
        user_prompt = """
        Table name: {};
        Database table field descriptions are as follows:
        {}

        The question is as follows:
        {}

        The incorrect SQL you provided last time is as follows:
        {}

        The backend error is as follows:
        {}

        Please correct the error in the SQL and write it again. Only provide the SQL without any additional explanations or text.
        """.format(
            index_name(tenant_id),
            "\n".join([f"{k}: {v}" for k, v in field_map.items()]),
            question, sql, tbl["error"]
        )
        chat_logger.error("GET table: {}".format(tbl["error"]))
        tbl, sql = get_table()
        chat_logger.info("TRY it again: {}".format(sql))

    chat_logger.error("GET table: {}".format(tbl))
    if tbl.get("error") or len(tbl["rows"]) == 0 or all([all(x is None for x in row[2:]) for row in tbl["rows"]]):
        return None

    docid_idx = set([ii for ii, c in enumerate(
        tbl["columns"]) if c["name"] == "doc_id"])
    docnm_idx = set([ii for ii, c in enumerate(
        tbl["columns"]) if c["name"] == "docnm_kwd"])
    clmn_idx = [ii for ii in range(
        len(tbl["columns"])) if ii not in (docid_idx | docnm_idx)]

    # compose markdown table
    clmns = "|" + "|".join([re.sub(r"(/.*|（[^（）]+）)", "", field_map.get(tbl["columns"][i]["name"],
                                                                        tbl["columns"][i]["name"])) for i in
                            clmn_idx]) + ("|Source|" if docid_idx and docid_idx else "|")

    line = "|" + "|".join(["------" for _ in range(len(clmn_idx))]) + \
           ("|------|" if docid_idx and docid_idx else "")

    rows = ["|" +
            "|".join([str(r[i]).strip() for i in clmn_idx]).replace("None", " ") +
            "|" for r in tbl["rows"] if r[clmn_idx[0]] is not None and not all(r[i] is None for i in clmn_idx[1:])]
    if len(rows) == 0:
        return None
    if quota:
        rows = "\n".join([r + f" ##{ii}$$ |" for ii, r in enumerate(rows)])
    else:
        rows = "\n".join([r + f" ##{ii}$$ |" for ii, r in enumerate(rows)])
    rows = re.sub(r"T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+Z)?\|", "|", rows)

    if not docid_idx or not docnm_idx:
        chat_logger.warning("SQL missing field: " + sql)
        return {
            "answer": "\n".join([clmns, line, rows]),
            "reference": {"chunks": [], "doc_aggs": []},
            "prompt": sys_prompt
        }

    docid_idx = list(docid_idx)[0]
    docnm_idx = list(docnm_idx)[0]
    doc_aggs = {}
    for r in tbl["rows"]:
        if r[docid_idx] not in doc_aggs:
            doc_aggs[r[docid_idx]] = {"doc_name": r[docnm_idx], "count": 0}
        doc_aggs[r[docid_idx]]["count"] += 1
    return {
        "answer": "\n".join([clmns, line, rows]),
        "reference": {"chunks": [{"doc_id": r[docid_idx], "docnm_kwd": r[docnm_idx]} for r in tbl["rows"]],
                      "doc_aggs": [{"doc_id": did, "doc_name": d["doc_name"], "count": d["count"]} for did, d in
                                   doc_aggs.items()]},
        "prompt": sys_prompt
    }
    
def full_question(tenant_id, llm_id, messages):
    """Generates a refined user question based on the conversation history.
    Args:
        tenant_id (str): The tenant identifier.
        llm_id (str): The language model identifier.
        messages (list): A list of message dictionaries, each containing 'role' and 'content' keys.
    Returns:
        str: The refined user question or the original question if no refinement is needed.
    The function processes the conversation history and generates a prompt for the language model.
    It ensures that the generated text is in the same language as the original user's question and
    adheres to specific requirements and restrictions. If the language model returns an error, the
    function returns the content of the last user message."""
    if llm_id2llm_type(llm_id) == "image2text":
        chat_mdl = LLMBundle(tenant_id, LLMType.IMAGE2TEXT, llm_id)
    else:
        chat_mdl = LLMBundle(tenant_id, LLMType.CHAT, llm_id)
    conv = []
    for m in messages:
        if m["role"] not in ["user", "assistant"]: continue
        conv.append("{}: {}".format(m["role"].upper(), m["content"]))
    conv = "\n".join(conv)
    prompt = f"""
Role: A helpful assistant
Task: Generate a full user question that would follow the conversation.
Requirements & Restrictions:
  - Text generated MUST be in the same language of the original user's question.
  - If the user's latest question is completely, don't do anything, just return the original question.
  - DON'T generate anything except a refined question.

######################
-Examples-
######################

# Example 1
## Conversation
USER: What is the name of Donald Trump's father?
ASSISTANT:  Fred Trump.
USER: And his mother?
###############
Output: What's the name of Donald Trump's mother?

------------
# Example 2
## Conversation
USER: What is the name of Donald Trump's father?
ASSISTANT:  Fred Trump.
USER: And his mother?
ASSISTANT:  Mary Trump.
User: What's her full name?
###############
Output: What's the full name of Donald Trump's mother Mary Trump?

######################

# Real Data
## Conversation
{conv}
###############
    """
    ans = chat_mdl.chat(prompt, [{"role": "user", "content": "Output: "}], {"temperature": 0.2})
    return ans if ans.find("**ERROR**") < 0 else messages[-1]["content"]

def tts(tts_mdl, text):
    if not tts_mdl or not text: return
    bin = b""
    for chunk in tts_mdl.tts(text):
        bin += chunk
    return binascii.hexlify(bin).decode("utf-8")

def llm_id2llm_type(llm_id):
    llm_id = llm_id.split("@")[0]
    fnm = os.path.join(get_project_base_directory(), "conf")
    llm_factories = json.load(open(os.path.join(fnm, "llm_factories.json"), "r"))
    for llm_factory in llm_factories["factory_llm_infos"]:
        for llm in llm_factory["llm"]:
            if llm_id == llm["llm_name"]:
                return llm["model_type"].strip(",")[-1]
            
def keyword_extraction(chat_mdl, content):
    prompt = """
You're a question analyzer. 
1. Please give me the most important keyword/phrase of this question.
Answer format: (in language of user's question)
 - keyword: 
"""
    kwd = chat_mdl.chat(prompt, [{"role": "user",  "content": content}], {"temperature": 0.2})
    if isinstance(kwd, tuple): return kwd[0]
    return kwd

def hyde(chat_mdl, content):
    prompt = f"""
        Given a question, generate a paragraph of text that answers the question.
    """
    kwd = chat_mdl.chat(prompt, [{"role": "user",  "content": content}], {"temperature": 0.8})
    if isinstance(kwd, tuple): return kwd[0]
    return kwd

def rewrite(tenant_id, llm_id, question):
    if llm_id2llm_type(llm_id) == "image2text":
        chat_mdl = LLMBundle(tenant_id, LLMType.IMAGE2TEXT, llm_id)
    else:
        chat_mdl = LLMBundle(tenant_id, LLMType.CHAT, llm_id)
    prompt = """
        You are an expert at query expansion to generate a paraphrasing of a question.
        I can't retrieval relevant information from the knowledge base by using user's question directly.     
        You need to expand or paraphrase user's question by multiple ways such as using synonyms words/phrase, 
        writing the abbreviation in its entirety, adding some extra descriptions or explanations, 
        changing the way of expression, etc. 
        And return 5 versions of question and one is from translation.
        Just list the question. No other words are needed.
    """
    ans = chat_mdl.chat(prompt, [{"role": "user", "content": question}], {"temperature": 0.8})
    return ans

if __name__ == "__main__":
    kb_id = "299cf968a7f811ef80220242ac140006"
    e, kb = KnowledgebaseService.get_by_id(kb_id)
    question = input("Question: ")
    retr = retrievaler
    docs = DocumentService.query(kb_id=kb_id, parser_id=ParserType.GSO)
    doc_ids = [doc.id for doc in docs]
    embd_mdl = LLMBundle(kb.tenant_id, LLMType.EMBEDDING, kb.embd_id)
    kbinfos = retr.retrieval(question, embd_mdl, kb.tenant_id, [kb_id],
                             1, 6, similarity_threshold=1, vector_similarity_weight=0.3,
                             doc_ids=doc_ids,
                             top=1024, aggs=False, rerank_mdl=None)
    print(len(kbinfos))
    for ck in kbinfos["chunks"]:
        print(ck["field_maps_tks"], type(ck["field_maps_tks"]))
        break