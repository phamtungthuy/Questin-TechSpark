import os
import base64
import uuid
import json
import time

from utils.file_utils import get_project_base_directory
from db.models.llm_models import LLM, LLMFactories
from db.db_services.user_service import UserService, UserTenantService
from db.db_services.llm_service import LLMFactoriesService, LLMService, TenantLLMService
from db.db_services.tenant_service import TenantService
from db.settings import CHAT_MDL, EMBEDDING_MDL, ASR_MDL, IMAGE2TEXT_MDL, PARSERS, LLM_FACTORY, API_KEY, LLM_BASE_URL, stat_logger
from db.constants import UserTenantRole


def encode_to_base64(input_string):
    base64_encoded = base64.b64encode(input_string.encode('utf-8'))
    return base64_encoded.decode('utf-8')

def init_superuser():
    if UserService.query(email="admin@questin.io", is_superuser=True):
       print("[Info] Superuser is already initialized.")
       return  
    user_info = {
        "id": uuid.uuid1().hex,
        "password": "admin",
        "nickname": "admin",
        "is_superuser": True,
        "email": "admin@questin.io",
        "creator": "system",
        "status": 1
    }
    
    tenant = {
        "id": user_info["id"],
        "name": user_info["nickname"] + "'s Kingdom",
        "llm_id": CHAT_MDL,
        "embd_id": EMBEDDING_MDL,
        "asr_id": ASR_MDL,
        "parser_ids": PARSERS,
        "img2txt_id": IMAGE2TEXT_MDL
    }
    usr_tenant = {
        "tenant_id": user_info["id"],
        "user_id": user_info["id"],
        "invited_by": user_info["id"],
        "role": UserTenantRole.OWNER
    }
    tenant_llm = []
    for llm in LLMService.query(fid=LLM_FACTORY):
        tenant_llm.append(
            {"tenant_id": user_info["id"], "llm_factory": LLM_FACTORY, "llm_name": llm.llm_name, "model_type": llm.model_type,
             "api_key": API_KEY, "api_base": LLM_BASE_URL})
    
    if not UserService.save(**user_info):
        print("\033[93m【ERROR】\033[0mcan't init admin.")
        return
    TenantService.insert(**tenant)
    UserTenantService.insert(**usr_tenant)
    TenantLLMService.insert_many(tenant_llm)
    print(
        "【INFO】Super user initialized. \033[93memail: admin@questin.io, password: admin\033[0m. Changing the password after logining is strongly recomanded.")
    
def init_llm_factory():
    factory_llm_infos = json.load(open(
        os.path.join(get_project_base_directory(), "conf", "llm_factories.json"),
        "r"
    ))
    for factory_llm_info in factory_llm_infos["factory_llm_infos"]:
        llm_infos = factory_llm_info.pop("llm")
        try:
            llm_factory = LLMFactoriesService.query(name = factory_llm_info["name"])
            if not llm_factory:
                LLMFactoriesService.save(**factory_llm_info)
        except Exception as e:
            print(str(e))
            pass
        LLMService.filter_delete([LLM.fid == factory_llm_info["name"]])
        for llm_info in llm_infos:
            llm_info["fid"] = factory_llm_info["name"]
            try:
                LLMService.save(**llm_info)
            except Exception as e:
                print(str(e))
                pass
            

    
def init_web_data():
    start_time = time.time()
    
    init_llm_factory()
    init_superuser()
    print("init web data success:{}".format(time.time() - start_time))
    
if __name__ == "__main__":
    init_web_data()

