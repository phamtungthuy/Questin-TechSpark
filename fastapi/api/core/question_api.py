import os
import json
import random
from fastapi import APIRouter, Request
from db.constants import LLMType
from db.db_services.conversation_service import ConversationService
from db.db_services.dialog_service import DialogService
from db.db_services.knowledgebase_service import KnowledgebaseService
from db.db_services.llm_service import LLMBundle
from db.settings import retrievaler
from services.nlp import search, rag_tokenizer

from services.conn.es_conn import ELASTICSEARCH
from utils import get_uuid
from utils.api_utils import (
    get_json_result, RetCode,
    get_data_error_result, login_required,
    validate_request, admin_required, server_error_response
)
from utils.file_utils import get_project_base_directory
from elasticsearch_dsl import Q, Search
import random
router = APIRouter(tags=['Question'])

def init_kb(tenant_id):
    idxnm = search.question_index_name(tenant_id)
    if ELASTICSEARCH.indexExist(idxnm):
        return
    return ELASTICSEARCH.createIdx(idxnm, json.load(
        open(os.path.join(get_project_base_directory(), "conf", "mapping.json"), "r")))

@router.get("/list")
async def list_question(request: Request):
    dialog_id = request.query_params.get('dialog_id')
    page_number = int(request.query_params.get("page", 1))
    items_per_page = int(request.query_params.get("items_per_page", 10))
    try:
        e, dia = DialogService.get_by_id(dialog_id)
        if not e:
            return get_json_result(
                data=False, retmsg="Not found dialog",
                retcode=RetCode.OPERATING_ERROR
            )
        tenant_id = dia.tenant_id
        if not tenant_id:
            return get_data_error_result(retmsg="Tenant not found!")
        init_kb(tenant_id)
        req = {
            "kb_ids": dia.kb_ids,
            "page": page_number,
            "size": 1024
        }
        sres = retrievaler.get_random(req, search.question_index_name(tenant_id))
        idx = list(range(len(sres.ids)))
        result = []
        for i in idx:
            id = sres.ids[i]
            result.append({
                "chunk_id": sres.field[id].get("chunk_id", None),
                "content_with_weight": sres.field[id]["content_with_weight"]
            })
        return get_json_result(data=random.sample(result, min(len(result), 4)))
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return server_error_response(e)
    
@router.get("/search")
async def search_question(request: Request):
    dialog_id = request.query_params.get('dialog_id')
    page_number = int(request.query_params.get("page", 1))
    items_per_page = int(request.query_params.get("items_per_page", 10))
    prev_question = str(request.query_params.get("prev_question", ""))
    
    try:
        e, dia = DialogService.get_by_id(dialog_id)
        if not e:
            return get_json_result(
                data=False, retmsg="Not found dialog",
                retcode=RetCode.OPERATING_ERROR
            )
        tenant_id = dia.tenant_id
        kbs = KnowledgebaseService.get_by_ids(dia.kb_ids)
        embd_nms = list(set([kb.embd_id for kb in kbs]))
        if len(embd_nms) != 1:
            raise ValueError("The number of embd_nms is not 1")
        embd_mdl = LLMBundle(dia.tenant_id, LLMType.EMBEDDING, embd_nms[0])
        
        if not tenant_id:
            return get_data_error_result(retmsg="Tenant not found!")
        init_kb(tenant_id)
        req = {
            "kb_ids": dia.kb_ids,
            "page": page_number,
            "size": 1024,
            "question": prev_question
        }
        sres = retrievaler.search(req, search.question_index_name(tenant_id), embd_mdl)
        idx = list(range(len(sres.ids)))
        result = []
        for i in idx:
            id = sres.ids[i]
            result.append({
                "chunk_id": sres.field[id].get("chunk_id", None),
                "content_with_weight": sres.field[id]["content_with_weight"]
            })
        return get_json_result(data=random.sample(result, min(len(result), 4)))
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return server_error_response(e)
    
        
@router.post("/set")
@admin_required
@validate_request("kb_id", "content_with_weight")
async def set_question(request: Request):
    try:
        req = await request.json()
    except Exception as e:
        return get_json_result(data=False, retcode=RetCode.EXCEPTION_ERROR,
                               retmsg=str(e)) 

    kb_id = req["kb_id"]
    question_id = req.get("question_id", None)
    d = {
        "id": get_uuid(),
        "content_with_weight": req["content_with_weight"],
    }
    d["content_ltks"] = rag_tokenizer.tokenize(req["content_with_weight"])
    d["contetn_sm_ltks"] = rag_tokenizer.fine_grained_tokenize(d["content_ltks"])
    d["kb_id"] = kb_id
    if "available_int" in req:
        d["available_int"] = req["available_int"]
    if "chunk_id" in req:
        d["chunk_id"] = req["chunk_id"]
    try:
        e, kb = KnowledgebaseService.get_by_id(kb_id)
        if not e:
            return get_data_error_result(retmsg="Knowledgebase not found!")
        tenant_id = kb.tenant_id
        if not tenant_id:
            return get_data_error_result(retmsg="Tenant not found!")
        embd_id = kb.embd_id
        embd_mdl = LLMBundle(tenant_id, LLMType.EMBEDDING, llm_name=embd_id)
        v, c = embd_mdl.encode_queries(req["content_with_weight"])
        d["q_%d_vec" % len(v)] = v.tolist()
        init_kb(tenant_id)
        ELASTICSEARCH.upsert([d], search.question_index_name(tenant_id))
        return get_json_result(data=True)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return server_error_response(e)