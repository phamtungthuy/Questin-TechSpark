from fastapi import Request, Query, APIRouter
from db.db_services.knowledgebase_service import KnowledgebaseService
from db.db_services.cluster_service import ClusterService
from db.db_services.tenant_service import TenantService
from db.db_services.user_service import UserTenantService
from db.db_services.document_service import DocumentService
from db.db_services.file_service import FileService
from db.db_services.file2document_service import File2DocumentService
from db.db_services.llm_service import LLMBundle
from db.models.cluster_models import Cluster
from db.models.file_models import File
from db.constants import FileSource, LLMType
from services.conn.es_conn import ELASTICSEARCH
from services.conn.storage_factory import STORAGE_IMPL
from utils import get_uuid
from utils.api_utils import (
    admin_required, validate_request, get_json_result, 
    get_data_error_result, server_error_response
)
from api.settings import RetCode
from services.nlp import search, rag_tokenizer
import datetime
from api.settings import stat_logger
import hashlib
from db.settings import retrievaler

router = APIRouter(tags=["Knowledgebase"])

@router.post("/set")
@admin_required
async def set_kb(request: Request):
    try:
        req = await request.json()
    except Exception as e:
        return get_json_result(data=False, retcode=RetCode.EXCEPTION_ERROR,
                               retmsg=str(e))
    if "is_new" in req:
        is_new = req.get("is_new")
        del req["is_new"]
        req["name"] = req["name"].strip()

    else:
        kb_id = req.get("kb_id")
        del req["kb_id"]
        try:
            if not KnowledgebaseService.update_by_id(kb_id, req):
                return get_data_error_result(retmsg="Knowledgebase not found!")
            e, kb = KnowledgebaseService.get_by_id(kb_id)
            if not e:
                return get_data_error_result(
                    retmsg="Fail to update a knowledgebase!"
                )
            kb = kb.to_dict()
            return get_json_result(data=kb)
        except Exception as e:
            return server_error_response(e)
    
    try:
        user = request.state.user
        req["id"] = get_uuid()
        req["tenant_id"] = user["id"]
        req["created_by"] = user["id"]
        e, t = TenantService.get_by_id(user["id"])
        if not e:
            return get_data_error_result(retmsg="Tenant not found")
        req["embd_id"] = t.embd_id
        if not KnowledgebaseService.save(**req):
            return get_data_error_result()
        e, kb = KnowledgebaseService.get_by_id(req["id"])
        if not e:
            return get_data_error_result(retmsg="Fail to create a new knowledgebase!")
        kb = kb.to_dict()
        return get_json_result(data=kb)
    except Exception as e:
        return server_error_response(e)
    
@router.get("/get")
@admin_required
async def detail(request: Request):
    kb_id = request.query_params.get("kb_id")
    user = request.state.user
    try:
        tenants = UserTenantService.query(user_id=user["id"])
        for tenant in tenants:
            if KnowledgebaseService.query(
                    tenant_id=tenant.tenant_id, id=kb_id):
                break
        else:
            return get_json_result(
                data=False, retmsg=f'Only owner of knowledgebase authorized for this operation.',
                retcode=RetCode.OPERATING_ERROR)
        kb = KnowledgebaseService.get_detail(kb_id)
        if not kb:
            return get_data_error_result(
                retmsg="Can't find this knowledgebase!")
        return get_json_result(data=kb)
    except Exception as e:
        return server_error_response(e)
    
@router.get("/list")
@admin_required
async def list_kbs(request: Request, 
                   page_number: int = Query(1, alias="page"),
                   items_per_page: int = Query(150, alias="page_size"),
                   orderby: str = Query("create_time", alias="orderby"),
                   desc: bool = Query(True, alias="desc")):
    user = request.state.user
    try:
        tenants = TenantService.get_joined_tenants_by_user_id(user["id"])
        kbs = KnowledgebaseService.get_by_tenant_ids(
            [m["tenant_id"] for m in tenants], user["id"], page_number, items_per_page, orderby, desc)
        return get_json_result(data=kbs)
    except Exception as e:
        return server_error_response(e)

def init_external_source_kb(tenant_id):
    idxnm = search.external_source_index_name(tenant_id)
    if ELASTICSEARCH.indexExist(idxnm):
        return
    return ELASTICSEARCH

@router.post("/retrieval")
@validate_request("kb_ids", "query")
async def retrieval(request: Request):
    try:
        req = await request.json()
    except Exception as e:
        return get_json_result(data=False, retcode=RetCode.EXCEPTION_ERROR,
                               retmsg=str(e))
    kb_ids = req["kb_ids"]
    kbs = KnowledgebaseService.get_by_ids(kb_ids)
    query = req["query"]
    try:
        embd_nms = list(set([kb.embd_id for kb in kbs]))
        tenant_id = kbs[0].tenant_id
        kb = kbs[0]
        embd_mdl = LLMBundle(tenant_id, LLMType.EMBEDDING, embd_nms[0])
        if len(embd_nms) != 1:
            return get_data_error_result(
                retmsg="Different embedding models in the same knowledgebase!")
        kbinfos = retrievaler.retrieval(
            query,
            embd_mdl,
            tenant_id,
            kb_ids,
            1,
            10,
            kb.similarity_threshold,
            kb.vector_similarity_weight,            
            doc_ids=None,
            top=1024,
            aggs=False,
            rerank_mdl=None,
            external_source=False
        )
        for c in kbinfos["chunks"]:
            if c.get("vector"):
                del c["vector"]
        return get_json_result(data=kbinfos)
    except Exception as e:
        return server_error_response(e)

@router.post("/set/external_source")
@admin_required
@validate_request("kb_id", "content", "title", "url")
async def set_external_source(request: Request):
    try:
        req = await request.json()
    except Exception as e:
        return get_json_result(data=False, retcode=RetCode.EXCEPTION_ERROR,
                               retmsg=str(e))
    
    kb_id = req["kb_id"]
    d = {
        "id": get_uuid(),
        "content_with_weight": req["content"],
        "docnm_kwd": req["url"],
        "title_kwd": req["title"],
    }
    d["content_ltks"] = rag_tokenizer.tokenize(req["content"])
    d["content_sm_ltks"] = rag_tokenizer.fine_grained_tokenize(d["content_ltks"])
    d["title_tks"] = rag_tokenizer.tokenize(req["title"])
    d["kb_id"] = [kb_id]
    d["doc_id"] = kb_id
    if "available_int" in req:
        d["available_int"] = req["available_int"]
    try:
        e, kb = KnowledgebaseService.get_by_id(kb_id)
        if not e:
            return get_data_error_result(retmsg="Knowledgebase not found!")
        tenant_id = kb.tenant_id
        if not tenant_id:
            return get_data_error_result(retmsg="Tenant not found!")
        embd_id = kb.embd_id
        embd_mdl = LLMBundle(tenant_id, LLMType.EMBEDDING, llm_name=embd_id)
        v, c = embd_mdl.encode_queries(d["content_with_weight"])
        d["q_%d_vec" % len(v)] = v.tolist()
        d["create_time"] = str(datetime.datetime.now()).replace("T", " ")[:19]
        d["create_timestamp_flt"] = datetime.datetime.now().timestamp()
        
        init_external_source_kb(tenant_id)
        ELASTICSEARCH.upsert([d], search.external_source_index_name(tenant_id))
        return get_json_result(data=True)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return server_error_response(e)        

@router.post("/rm")
@admin_required
@validate_request("kb_ids")
async def rm(request: Request):
    try:
        req = await request.json()
    except Exception as e:
        return get_json_result(data=False, retcode=RetCode.EXCEPTION_ERROR,
                               retmsg=str(e))
    user = request.state.user
    kb_ids = req["kb_ids"]
    try:
        for kb_id in kb_ids:
            kbs = KnowledgebaseService.query(
                created_by=user["id"], id=kb_id
            )
            if not kbs:
                return get_json_result(
                    data=False, retmsg=f"Only owner of knowledgebase authorized for this operation",
                    retcode=RetCode.OPERATING_ERROR
                )
            
            for doc in DocumentService.query(kb_id=kb_id):
                b, n = File2DocumentService.get_storage_address(doc_id = doc.id)
                
                if not DocumentService.remove_document(doc, kbs[0].tenant_id):
                    return get_data_error_result(
                        retmsg="Database error (Document removal)!")
                f2d = File2DocumentService.get_by_document_id(doc.id)
                FileService.filter_delete([File.source_type == FileSource.KNOWLEDGEBASE, File.id == f2d[0].file_id])
                File2DocumentService.delete_by_document_id(doc.id)

                STORAGE_IMPL.rm(b, n)

            for cluster in ClusterService.query(kb_id=kb_id):
                if not ClusterService.delete_by_id(cluster.id):
                    return get_data_error_result(
                        retmsg="Database error (Cluster removal)!")
                    
            if not KnowledgebaseService.delete_by_id(kb_id):
                return get_data_error_result(
                    retmsg="Database error (Knowledgebase removal)!"
                )
        return get_json_result(data=True)
    except Exception as e:
        return server_error_response(e)