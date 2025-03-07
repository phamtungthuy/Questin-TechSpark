from fastapi import APIRouter, Request
from db.db_services.user_service import UserTenantService
from db.db_services.knowledgebase_service import KnowledgebaseService
from db.db_services.llm_service import LLMBundle
from utils.api_utils import (
    admin_required, get_json_result, validate_request,
    get_data_error_result, RetCode, server_error_response
)
from db.constants import LLMType
from db.settings import retrievaler

router = APIRouter(tags=['Chunk'])

@router.post("/retrieval_test")
@admin_required
@validate_request("kb_id", "question")
async def retrieval_test(request: Request):
    try:
        req = await request.json()
    except Exception as e:
        return get_json_result(data=False, retcode=RetCode.EXCEPTION_ERROR,
                               retmsg=str(e))
    page = int(req.get("page", 1))
    size = int(req.get("size", 30))
    question = req["question"]
    kb_ids = req["kb_id"]
    if isinstance(kb_ids, str):
        kb_ids = [kb_ids]
    doc_ids = req.get("doc_ids", None)
    similarity_threshold = float(req.get("similarity_threshold", 0.1))
    vector_similarity_weight = float(req.get("vector_similarity_weight", 0.7))
    top = int(req.get("top_k", 1024))
    tenant_ids = []
    user = request.state.user
    try:
        tenants = UserTenantService.query(user_id=user["id"])
        for kb_id in kb_ids:
            for tenant in tenants:
                if KnowledgebaseService.query(
                    tenant_id=tenant.tenant_id, id=kb_id):
                    tenant_ids.append(tenant.tenant_id)
                    break
            else:
                return get_json_result(data=False, message='Only owner of knowledgebase authorized for this operation.',
                                       code=RetCode.OPERATING_ERROR)
        e, kb = KnowledgebaseService.get_by_id(kb_ids[0])
        if not e:
            return get_data_error_result(message="Knowledgebase not found!")
        
        embd_mdl = LLMBundle(kb.tenant_id, LLMType.EMBEDDING.value, llm_name=kb.embd_id)
        
        rerank_mdl = None
        if req.get("rerank_id"):
            rerank_mdl = LLMBundle(kb.tenant_id, LLMType.RERANK.value, llm_name=req["rerank_id"])
            
        if req.get("keyword", False):
            chat_mdl = LLMBundle(kb.tenant_id, LLMType.CHAT)
            
        retr = retrievaler
        ranks = retr.retrieval(question, embd_mdl, tenant_ids[0], kb_ids, page, size,
                               similarity_threshold, vector_similarity_weight, top,
                               doc_ids, rerank_mdl)
        for c in ranks["chunks"]:
            c.pop("vector", None)   
        return get_json_result(data=ranks)
    except Exception as e:
        return server_error_response(e)