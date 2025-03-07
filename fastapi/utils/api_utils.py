from functools import wraps
from api.settings import RetCode, SECRET_KEY, ALGORITHM, stat_logger
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi import Request
import jwt

from datetime import timedelta, datetime, timezone


def get_json_result(retcode=RetCode.SUCCESS, retmsg='success', data=None):
    response = {"retcode": retcode, "retmsg": retmsg, "data": data}
    return jsonable_encoder(response)

def get_data_error_result(retcode=RetCode.DATA_ERROR,
                          retmsg="Sorry! Data missing!"):
    import re
    result_dict = {
        "retcode": retcode,
        "retmsg": re.sub(
            r"rag",
            "seceum",
            retmsg,
            flags=re.IGNORECASE
        )
    }
    response = {}
    for key, value in result_dict.items():
        if value is None and key != "retcode":
            continue
        else:
            response[key] = value
    return jsonable_encoder(response)

def server_error_response(e):
    stat_logger.exception(e)
    try:
        if e.code == 401:
            return get_json_result(retcode=401, retmsg=repr(e))
    except BaseException:
        pass
    if len(e.args) > 1:
        return get_json_result(
            retcode=RetCode.EXCEPTION_ERROR, retmsg=repr(e.args[0]), data=e.args[1])
    if repr(e).find("index_not_found_exception") >= 0:
        return get_json_result(retcode=RetCode.EXCEPTION_ERROR,
                               retmsg="No chunk found, please upload file and parse it.")

    return get_json_result(retcode=RetCode.EXCEPTION_ERROR, retmsg=repr(e))

def construct_response(retcode=RetCode.SUCCESS,
                 retmsg='success', data=None, auth=None):
    result_dict = {"retcode": retcode, "retmsg": retmsg, "data": data}
    response_dict = {}
    for key, value in result_dict.items():
        if value is None and key != "retcode":
            continue
        else:
            response_dict[key] = value
    response = JSONResponse(content=jsonable_encoder(response_dict))
    if auth:
        response.headers["Authorization"] = auth
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Method"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Expose-Headers"] = "Authorization"
    return response

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt       

def attach_user_info(func):
    @wraps(func)
    async def decorated_function(request: Request, *args, **kwargs):
        token = request.headers.get("Authorization", None)
        
        if token and token.startswith("Bearer "):
            token = token.split(" ")[1]
            try:
                user = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                request.state.user = user
            except Exception as e:
                request.state.user = None
        else:
            request.state.user = None

        return await func(request, *args, **kwargs)
    return decorated_function

def login_required(func):
    @wraps(func)
    async def decorated_function(request: Request, *args, **kwargs):
        token = request.headers.get('Authorization')
        
        if token is None:
            return get_json_result(
                retcode=RetCode.UNAUTHORIZED, retmsg="Not authenticated")
            
        if token.startswith("Bearer "):
            token = token.split(" ")[1]
        try:
            user = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            request.state.user = user
        except Exception as e:
            return get_json_result(retcode=RetCode.UNAUTHORIZED,
                                   retmsg=str(e))
        
        return await func(request, *args, **kwargs)
    return decorated_function

def admin_required(func):
    @wraps(func)
    async def decorated_function(request: Request, *args, **kwargs):
        token = request.headers.get('Authorization')
        
        if token is None:
            return get_json_result(
                retcode=RetCode.UNAUTHORIZED, retmsg="Not authenticated")
        
        if token.startswith("Bearer "):
            token = token.split(" ")[1]
        try:
            user = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            
            # Kiểm tra xem user có phải là admin không
            if not user.get("is_superuser", False):
                return get_json_result(
                    retcode=RetCode.FORBIDDEN,
                    retmsg="Admin privileges required"
                )
            
            request.state.user = user
            
        except Exception as e:
            return get_json_result(retcode=RetCode.UNAUTHORIZED,
                                   retmsg=str(e))
        return await func(request, *args, **kwargs)
    return decorated_function

def validate_request(*args, **kwargs):
    
    def wrapper(func):
        @wraps(func)
        async def decorated_function(request: Request, *_args, **_kwargs):
            try:
                
                input_arguments = await request.json() 
            except Exception:
                input_arguments = await request.form()
            input_arguments = dict(input_arguments)
            
            no_arguments = []
            error_arguments = []
            
            for arg in args:
                if arg not in input_arguments:
                    no_arguments.append(arg)
                    
            for k, v in kwargs.items():
                config_value = input_arguments.get(k, None)
                if config_value is None:
                    no_arguments.append(k)
                elif isinstance(v, (tuple, list)):
                    if config_value not in v:
                        error_arguments.append((k, set(v)))
                elif config_value != v:
                    error_arguments.append((k, v))
            
            if no_arguments or error_arguments:
                error_string = ""
                if no_arguments:
                    error_string += "required argument are missing: {}; ".format(
                        ",".join(no_arguments))
                if error_arguments:
                    error_string += "required argument values: {}".format(
                        ",".join(["{}={}".format(a[0], a[1]) for a in error_arguments]))
                return get_json_result(
                    retcode=RetCode.ARGUMENT_ERROR, retmsg=error_string)
            return await func(request, *_args, **_kwargs)
        
        return decorated_function
    
    return wrapper