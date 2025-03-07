import re

from services.graph_rag.index import build_knowlege_graph_chunks
from services.deepdoc.domain_parser import naive
from services.nlp import rag_tokenizer, tokenize_chunks


def chunk(filename, binary, tenant_id, from_page=0, to_page=100000,
          lang="Chinese", callback=None, **kwargs):
    parser_config = kwargs.get(
        "parser_config", {
            "chunk_token_num": 512, "delimiter": "\n!?。；！？", "layout_recognize": False})
    eng = lang.lower() == "english"

    parser_config["layout_recognize"] = False
    sections = naive.chunk(filename, binary, from_page=from_page, to_page=to_page, section_only=True,
                           parser_config=parser_config, callback=callback)
    chunks = build_knowlege_graph_chunks(tenant_id, sections, callback,
                                         parser_config.get("entity_types", ["organization", "person", "location", "event", "time"])
                                         )
    for c in chunks: c["docnm_kwd"] = filename

    doc = {
        "docnm_kwd": filename,
        "title_tks": rag_tokenizer.tokenize(re.sub(r"\.[a-zA-Z]+$", "", filename)),
        "title_kwd": filename,
        "knowledge_graph_kwd": "text"
    }
    doc["title_sm_tks"] = rag_tokenizer.fine_grained_tokenize(doc["title_tks"])
    chunks.extend(tokenize_chunks(sections, doc, eng))

    return chunks

if __name__ == '__main__':
    def donothing(progress=0.1, msg=""):
        pass
    from functools import partial
    callback = partial(donothing)
    chunks = chunk("./tmp.txt", binary=None, tenant_id= "746c1aead04911ef9ce60242ac120006",callback=callback)
    for chunk in chunks:
        print(chunk)