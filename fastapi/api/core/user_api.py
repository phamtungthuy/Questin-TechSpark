import re
from datetime import datetime
from fastapi import Request, APIRouter
from fastapi.responses import RedirectResponse
from utils import (
    get_uuid, decrypt, get_format_time, 
    current_timestamp, datetime_format, download_img
)
from fastapi.encoders import jsonable_encoder
from utils.api_utils import (
    get_json_result, validate_request, construct_response, 
    login_required, create_access_token, admin_required,
    server_error_response, get_data_error_result
)
from api.settings import (
    RetCode, stat_logger, GOOGLE_OAUTH
)

from db.db_services.tenant_service import TenantService
from db.db_services.user_service import UserService, UserTenantService
from db.db_services.llm_service import LLMService, TenantLLMService
from db.constants import UserTenantRole
from db.settings import CHAT_MDL, EMBEDDING_MDL, ASR_MDL, PARSERS, IMAGE2TEXT_MDL, RERANK_MDL, LLM_FACTORY, LLM_BASE_URL, API_KEY

router = APIRouter(
    tags=['User']
)

@router.post("/login")
async def login(request: Request):
    try:
        data = await request.json()
    except Exception as e:
        return get_json_result(data=False, retcode=RetCode.EXCEPTION_ERROR,
                               retmsg=str(e))
    email = data.get("email", "")
    users = UserService.query(email=email)
    if not users:
        return get_json_result(
            data=False, retcode=RetCode.AUTHENTICATION_ERROR, retmsg=f'This Email is not registered!')
    password = data.get('password')
    # try:
    #     password = decrypt(password)
    # except BaseException:
    #     return get_json_result(data=False,
    #                            retcode=RetCode.SERVER_ERROR,
    #                            retmsg='Fail to crypt password')
    user = UserService.query_user(email, password)
    if user:
        response_data = user.to_json().copy()
        access_token = create_access_token(jsonable_encoder(response_data))
        response_data["access_token"] = access_token
        user.access_token = get_uuid()
        user.update_time = current_timestamp()
        user.update_date = datetime_format(datetime.now())
        user.save()
        msg = "Welcome back!"
        return construct_response(data=response_data, auth=user.get_id(), retmsg=msg)
    else:
        return get_json_result(data=False,
                               retcode=RetCode.AUTHENTICATION_ERROR,
                               retmsg='Email and password do not match')

@router.get("/info", tags=["User"])
@login_required
async def user_profile(request: Request):
    return get_json_result(data=request.state.user)

def rollback_user_registration(user_id):
    try:
        UserService.delete_by_id(user_id)
    except Exception as e:
        pass

def user_register(user_id, user):
    user["id"] = user_id
    # tenant = {
    #     "id": user_id,
    #     "name": user["nickname"] + "‘s Kingdom",
    #     "llm_id": CHAT_MDL,
    #     "embd_id": EMBEDDING_MDL,
    #     "asr_id": ASR_MDL,
    #     "parser_ids": PARSERS,
    #     "img2txt_id": IMAGE2TEXT_MDL,
    #     "rerank_id": RERANK_MDL
    # }
    # usr_tenant = {
    #     "tenant_id": user_id,
    #     "user_id": user_id,
    #     "invited_by": user_id,
    #     "role": UserTenantRole.OWNER
    # }
    # tenant_llm = []
    # for llm in LLMService.query(fid=LLM_FACTORY):
    #     tenant_llm.append({"tenant_id": user_id,
    #                        "llm_factory": LLM_FACTORY,
    #                        "llm_name": llm.llm_name,
    #                        "model_type": llm.model_type,
    #                        "api_key": API_KEY,
    #                        "api_base": LLM_BASE_URL
    #                        })
    if not UserService.save(**user):
        return
    # TenantService.insert(**tenant)
    # UserTenantService.insert(**usr_tenant)
    # TenantLLMService.insert_many(tenant_llm)
    return UserService.query(email=user["email"])

@router.post("/register")
@validate_request("nickname", "email", "password")
async def register(request: Request):
    req = await request.json()
    email_address = req["email"]
    
    if not re.match(r"^[\w\._-]+@([\w_-]+\.)+[\w-]{2,5}$", email_address):
        return get_json_result(data=False,
                               retmsg=f'Invalid email address: {email_address}!',
                               retcode=RetCode.OPERATING_ERROR)
    
    if UserService.query(email=email_address):
        return get_json_result(
            data=False,
            retmsg=f'Email: {email_address} has already registered!',
            retcode=RetCode.OPERATING_ERROR)
    
    nickname = req["nickname"]
    user_dict = {
        "access_token": get_uuid(),
        "email": email_address,
        "nickname": nickname,
        "password":  req["password"], # decrypt(req["password"]),
        "login_channel": "password",
        "last_login_time": get_format_time(),
        "is_superuser": False
    }
    
    user_id = get_uuid()
    try:
        users = user_register(user_id, user_dict)
        if not users:
            raise Exception(f'Fail to register {email_address}.')
        if len(users) > 1:
            raise Exception(f'Same email: {email_address} exists!')
        user = users[0]
        return construct_response(data=user.to_json(),
                                  auth=user.get_id(),
                                  retmsg=f"{nickname}, welcome aboard!")
    except Exception as e:
        rollback_user_registration(user_id)
        stat_logger.exception(e)
        return get_json_result(
            data=False,
            retmsg=f'User registration failure, error: {str(e)}',
            retcode=RetCode.EXCEPTION_ERROR
        )
        
@router.get("/google_callback")
def google_callback(request: Request):
    import requests
    GOOGLE_USER_INFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'
    token_url = "https://accounts.google.com/o/oauth2/token"
    data = {
        "code": request.query_params.get('code'),
        "client_id": GOOGLE_OAUTH.get("client_id"),
        "client_secret": GOOGLE_OAUTH.get("secret_key"),
        "redirect_uri": request.query_params.get('redirect_uri'),
        "grant_type": "authorization_code",
    }
    response = requests.post(token_url, data=data)
    access_token = response.json().get("access_token")
    user_info = requests.get("https://www.googleapis.com/oauth2/v1/userinfo", headers={"Authorization": f"Bearer {access_token}"})
    user_info = user_info.json()
    email_address = user_info.get("email")
    nickname = user_info.get("given_name", "") + " " + user_info.get("family_name", "")
    user_dict = {
        "access_token": access_token,
        "email": email_address,
        "nickname": nickname,
        "password": "",
        "login_channel": "google",
        "last_login_time": get_format_time(),
        "is_superuser": False
    }
    user_id = get_uuid()
    users = UserService.query(email=user_dict["email"], login_channel=user_dict["login_channel"])
    msg = "Welcome back!"
    if users:
        user = users[0]
        response_data = user.to_json().copy()
        access_token = create_access_token(jsonable_encoder(response_data))
        response_data["access_token"] = access_token
        user.access_token = get_uuid()
        user.update_time = current_timestamp()
        user.update_date = datetime_format(datetime.now())
        user.save()
        return construct_response(data=response_data, auth=user.get_id(), retmsg=msg)

    try:
        users = user_register(user_id, user_dict)
        if not users:
            raise Exception(f'Fail to register {email_address}.')
        if len(users) > 1:
            raise Exception(f'Same email: {email_address} exists!')
        user = users[0]
        response_data = user.to_json().copy()
        access_token = create_access_token(jsonable_encoder(response_data))
        response_data["access_token"] = access_token
        return construct_response(data=response_data,
                                    auth=user.get_id(),
                                    retmsg=f"{nickname}, welcome aboard!")
    except Exception as e:
        rollback_user_registration(user_id)
        stat_logger.exception(e)
        return get_json_result(
            data=False,
            retmsg=f"User registration failure, error: {str(e)}",
            retcode=RetCode.EXCEPTION_ERROR
        )
        
@router.get("/tenant_info")
@admin_required
async def tenant_info(request: Request):
    user = request.state.user
    try:
        tenants = TenantService.get_info_by(user["id"])
        if not tenants:
            return get_data_error_result(retmsg="Tenant not found!")
        return get_json_result(data=tenants[0])
    except Exception as e:
        return server_error_response(e)
def user_info_from_google(access_token):
    import requests
    headers = {"Accept": "application/json",
               "Authorization": f"Bearer {access_token}"}
    res = requests.get("https://www.googleapis.com/oauth2/v3/userinfo",
                       headers=headers)
    user_info = res.json()
    return user_info