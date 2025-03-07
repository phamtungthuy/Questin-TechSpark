from fastapi import APIRouter, Request
from api.settings import RetCode
from db.db_services.tenant_service import TenantService
from db.db_services.user_service import UserTenantService
from db.db_services.dialog_service import DialogService
from db.db_services.knowledgebase_service import KnowledgebaseService
from db.constants import StatusEnum
from utils import get_uuid
from utils.api_utils import (
    admin_required, get_json_result, validate_request,
    get_data_error_result, server_error_response, login_required
)


router = APIRouter(tags=['Dialog'])

def get_kb_names(kb_ids):
    ids, nms = [], []
    for kid in kb_ids:
        e, kb = KnowledgebaseService.get_by_id(kid)
        if not e or kb.status != StatusEnum.VALID.value:
            continue
        ids.append(kid)
        nms.append(kb.name)
    return ids, nms

@router.post("/set")
@admin_required
async def set_dialog(request: Request):
    try:
        req = await request.json()
    except Exception as e:
        return get_json_result(data=False, retcode=RetCode.EXCEPTION_ERROR,
                               retmsg=str(e))
    user = request.state.user
    dialog_id = req.get("dialog_id", None)
    name = req.get("name", "New Dialog")
    description = req.get("description", "A helpful Dialog")
    icon = req.get("icon", "")
    top_n = req.get("top_n", 6)
    top_k = req.get("top_k", 1024)
    rerank_id = req.get("rerank_id", "")
    similarity_threshold = req.get("similarity_threshold", 0.1)
    vector_similarity_weight = req.get("vector_similarity_weight", 0.7)
    llm_setting = req.get("llm_setting", {})
    default_prompt = {
        "system": """Bạn là một trợ lý thông minh, hãy tóm tắt nội dung của kho kiến thức để trả lời câu hỏi, vui lòng liệt kê dữ liệu trong kho kiến thức để trả lời chi tiết. Khi tất cả nội dung của kho kiến thức đều không liên quan đến câu hỏi, câu trả lời của bạn phải bao gồm câu “Không tìm thấy câu trả lời mà bạn muốn trong kho kiến thức!”. Câu trả lời cần cân nhắc đến lịch sử trò chuyện.
    Dưới đây là kho kiến thức:
    {knowledge}
    Đây là kho kiến thức.""",
        "prologue": "Xin chào, tôi là trợ lý của bạn, tôi có thể giúp gì cho bạn?",
        "parameters": [
            {"key": "knowledge", "optional": False}
        ],
        "empty_response": "Xin lỗi! Không tìm thấy nội dung liên quan trong kho kiến thức!"
    }
    prompt_config = req.get("prompt_config", default_prompt)
    
    if not prompt_config["system"]:
        prompt_config["system"] = default_prompt["system"]
    
    for p in prompt_config["parameters"]:
        if p["optional"]:
            continue
        if prompt_config["system"].find("{%s}" % p["key"]) < 0:
            return get_data_error_result(
                retmsg="Parameter '{}' is not used".format(p["key"])
            )
    try:
        e, tenant = TenantService.get_by_id(user["id"])
        if not e:
            return get_data_error_result(retmsg="Tenant not found!")
        llm_id = req.get("llm_id", tenant.llm_id)
        if not dialog_id:
            if not req.get("kb_ids"):
                return get_data_error_result(
                    retmsg="Fail! Please select knowledgebase!"
                )
            dia = {
                "id": get_uuid(),
                "tenant_id": user["id"],
                "name": name,
                "kb_ids": req["kb_ids"],
                "llm_id": llm_id,
                "llm_setting": llm_setting,
                "prompt_config": prompt_config,
                "top_n": top_n,
                "top_k": top_k,
                "rerank_id": rerank_id,
                "similarity_threshold": similarity_threshold,
                "vector_similarity_weight": vector_similarity_weight,
                "icon": icon
            }
            if not DialogService.save(**dia):
                return get_data_error_result(retmsg="Fail to new a dialog!")
            e, dia = DialogService.get_by_id(dia["id"])
            if not e:
                return get_data_error_result(retmsg="Fail to new a dialog!")
            return get_json_result(data=dia.to_json())
        else:
            del req["dialog_id"]
            if "kb_names" in req:
                del req["kb_names"]
            if not DialogService.update_by_id(dialog_id, req):
                return get_data_error_result(retmsg="Dialog not found!")
            e, dia = DialogService.get_by_id(dialog_id)
            if not e:
                return get_data_error_result(retmsg="Fail to update a dialog!")
            dia = dia.to_dict()
            dia["kb_ids"], dia["kb_names"] = get_kb_names(dia["kb_ids"])
            return get_json_result(data=dia)
    except Exception as e:
        return server_error_response(e)

@router.get("/get")
async def get(request: Request):
    dialog_id = request.query_params.get("dialog_id")
    try:
        e, dia = DialogService.get_by_id(dialog_id)
        if not e:
            return get_data_error_result(message="Dialog not found!")
        dia = dia.to_dict()
        dia["kb_ids"], dia["kb_names"] = get_kb_names(dia["kb_ids"])
        return get_json_result(data=dia)
    except Exception as e:
        return server_error_response(e)

@router.get("/list")
async def list_dialogs(request: Request):
    try:
        diags = DialogService.query(
            status=StatusEnum.VALID.value,
            reverse=True,
            order_by=DialogService.model.create_time
        )
        diags = [d.to_dict() for d in diags]
        for d in diags:
            d["kb_ids"], d["kb_names"] = get_kb_names(d["kb_ids"])
        return get_json_result(data=diags)
    except Exception as e:
        return server_error_response(e)
    
@router.post("/rm")
@admin_required
@validate_request("dialog_ids")
async def rm(request: Request):
    try:
        req = await request.json()
    except Exception as e:
        return get_json_result(data=False, retcode=RetCode.EXCEPTION_ERROR,
                               retmsg=str(e)) 
    user = request.state.user
    dialog_list = []
    tenants = UserTenantService.query(user_id=user["id"])
    try:
        for id in req["dialog_ids"]:
            for tenant in tenants:
                if DialogService.query(tenant_id=tenant.tenant_id, id=id):
                    break
            else:
                return get_json_result(
                    data=False, retmsg=f"Only owner of dialog authorized for this operation.",
                    retcode=RetCode.OPERATING_ERROR
                )
            dialog_list.append({"id": id, "status": StatusEnum.INVALID.value})
        DialogService.update_many_by_id(dialog_list)
        return get_json_result(data=True)
    except Exception as e:
        return server_error_response(e)
    
    