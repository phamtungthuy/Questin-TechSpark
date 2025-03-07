import json

from fastapi import APIRouter, Request

from api.settings import RetCode
from db.constants import LLMType, StatusEnum
from db.models.tenant_models import TenantLLM
from db.db_services.llm_service import TenantLLMService, LLMFactoriesService, LLMService
from utils.api_utils import (
    validate_request, admin_required, get_json_result,
    get_data_error_result, server_error_response
)
from services.llm import EmbeddingModel


router = APIRouter()

@router.get("/factories")
@admin_required
async def factories(request: Request):
    try:
        fac = LLMFactoriesService.get_all()
        fac = [f.to_dict() for f in fac if f.name not in ["Youdao", "FastEmbed", "BAAI"]]
        llms = LLMService.get_all()
        mdl_types = {}
        for m in llms:
            if m.status != StatusEnum.VALID.value:
                continue
            if m.fid not in mdl_types:
                mdl_types[m.fid] = set([])
            mdl_types[m.fid].add(m.model_type)
        for f in fac:
            f["model_types"] = list(mdl_types.get(f["name"], [LLMType.CHAT, LLMType.EMBEDDING, LLMType.RERANK,
                                                              LLMType.IMAGE2TEXT, LLMType.SPEECH2TEXT, LLMType.TTS]))
        return get_json_result(data=fac)
    except Exception as e:
        return server_error_response(e)

@router.post("/add")
@admin_required
@validate_request("llm_factory")
async def add_llm(request: Request):
    try:
        req = await request.json()
    except Exception as e:
        return get_json_result(data=False, retcode=RetCode.EXCEPTION_ERROR,
                               retmsg=str(e))
    factory = req["llm_factory"]
    user = request.state.user
    if factory == "LocalAI":
        llm_name = req["llm_name"]+"___LocalAI"
        api_key = "xxxxxxxxxxxxxxx"
    else:
        llm_name = req["llm_name"]
        api_key = req.get("api_key", "xxxxxx")
        
    llm = {
        "tenant_id": user["id"],
        "llm_factory": factory,
        "model_type": req["model_type"],
        "llm_name": llm_name,
        "api_base": req.get("api_base", ""),
        "api_key": api_key
    }
    
    msg = ""
    if llm["model_type"] == LLMType.EMBEDDING.value:
        mdl = EmbeddingModel[factory](
            key=llm["api_key"],
            model_name=llm["llm_name"],
            base_url=llm["api_base"]
        )
        try:
            arr, tc = mdl.encode(["Test if the api key is available"])
            if len(arr[0]) == 0 or tc == 0:
                raise Exception("Fail")
        except Exception as e:
            msg += f"\nFail to access embedding model({llm['llm_name']})." + str(e)
            
    if msg:
        return get_data_error_result(retmsg=msg)
    
    if not TenantLLMService.filter_update(
        [TenantLLM.tenant_id == user["id"], TenantLLM.llm_factory == factory, TenantLLM.llm_name == llm["llm_name"]], llm):
        TenantLLMService.save(**llm)
    
    return get_json_result(data=True)

@router.get("/list")
@admin_required
async def list_llm(request: Request):
    user = request.state.user
    try:
        llms = TenantLLMService.query(tenant_id=user["id"])
        llms_data = [llm.to_dict() for llm in llms]
        
        return get_json_result(data=llms_data)
    except Exception as e:
        return server_error_response(e)

@router.get("/my_llms")
@admin_required
async def my_llms(request: Request):
    user = request.state.user
    try:
        res = {}
        for o in TenantLLMService.get_my_llms(user["id"]):
            if o["llm_factory"] not in res:
                res[o["llm_factory"]] = {
                    "tags": o["tags"],
                    "llm": []
                }
            res[o["llm_factory"]]["llm"].append({
                "type": o["model_type"],
                "name": o["llm_name"],
                "used_token": o["used_tokens"]
            })
        return get_json_result(data=res)
    except Exception as e:
        return server_error_response(e)
    
@router.post("/set_api_key")
@admin_required
@validate_request("llm_factory", "api_key")
async def set_api_key(request: Request):
    try:
        req = await request.json()
    except Exception as e:
        return get_json_result(data=False, retcode=RetCode.EXCEPTION_ERROR,
                               retmsg=str(e))
    user = request.state.user
    factory = req["llm_factory"]
    msg = ""
    llm_config = {
        "api_key": req["api_key"],
        "api_base": req.get("base_url", "")
    }
    for n in ["model_type", "llm_name"]:
        if n in req:
            llm_config[n] = req[n]

    for llm in LLMService.query(fid=factory):
        if not TenantLLMService.filter_update(
                [TenantLLM.tenant_id == user["id"],
                 TenantLLM.llm_factory == factory,
                 TenantLLM.llm_name == llm.llm_name],
                llm_config):
            TenantLLMService.save(
                tenant_id=user["id"],
                llm_factory=factory,
                llm_name=llm.llm_name,
                model_type=llm.model_type,
                api_key=llm_config["api_key"]
            )
    return get_json_result(data=True)

