from fastapi import APIRouter, Request
from api.settings import RetCode
from db.db_services.integration_service import IntegrationService, ProviderService, CredentialService
from db.db_services.tenant_service import TenantService
from db.constants import IntegrationType, CredentialType
from utils import get_uuid
from utils.api_utils import (
    admin_required, get_json_result, validate_request,
    get_data_error_result, server_error_response, login_required
)
from services.conn.redis_conn import REDIS_CONN


import secrets

router = APIRouter(tags=['Integration'])

@router.get("/providers")
async def get_providers(request: Request):
    try:
        response = ProviderService.get_providers()
        return response
    except Exception as e:
        return server_error_response(e)
    
@router.get("/integration")
async def add_integration(request: Request):
    try:
        response = ProviderService.get_providers()
        return response
    except Exception as e:
        return server_error_response(e)

@router.get("/webhook/generate")
async def generate_webhook(request: Request):
    try:
        token = secrets.token_urlsafe(16) 
        webhook_path = request.url_for("webhook_handler", token=token).path
        webhook_url = str(request.base_url)[:-1] + webhook_path

        return {"webhook_url": webhook_url, "token": token}
    
    except Exception as e:
        return {"error": str(e)}

@router.post("/webhook/{token}/", name="webhook_handler")
async def webhook_handler(token: str, payload: dict):
    return {"message": f"Webhook {token} received", "payload": payload}
    
@router.post("/add", name="add_integration")
@validate_request("dialog_id", "provider_id")
async def webhook_handler(request: Request):
    data = await request.json()
    dialog_id = data.get("dialog_id")
    provider_id = data.get("provider_id")
    try:
        IntegrationService.insert(**{"dialog_id" : dialog_id, "provider_id" : provider_id})
        return {"success" : data.get("dialog_id")}
    except Exception as e:
        return server_error_response(e)
    
@router.post("/add", name="add_integration")
@validate_request("dialog_id", "provider_id")
async def webhook_handler(request: Request):
    data = await request.json()
    dialog_id = data.get("dialog_id")
    provider_id = data.get("provider_id")
    try:
        res = IntegrationService.add_integration(**{"dialog_id" : dialog_id, "provider_id" : provider_id})
        return {"success" : res}
    except Exception as e:
        return server_error_response(e)
