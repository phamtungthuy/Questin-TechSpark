from db.conn import DB
from db.db_services.common_service import CommonService
from db.models.tenant_models import Tenant
from db.models.user_models import UserTenant
from db.constants import StatusEnum, UserTenantRole

class TenantService(CommonService):
    model = Tenant
    
    @classmethod
    @DB.connection_context()
    def get_info_by(cls, user_id):
        fields = [
            cls.model.id.alias("tenant_id"),
            cls.model.name,
            cls.model.llm_id,
            cls.model.embd_id,
            cls.model.rerank_id,
            cls.model.asr_id,
            cls.model.img2txt_id,
            cls.model.tts_id,
            cls.model.parser_ids,
            UserTenant.role]
        return list(cls.model.select(*fields)
                    .join(UserTenant, on=((cls.model.id == UserTenant.tenant_id) & (UserTenant.user_id == user_id) & (UserTenant.status == StatusEnum.VALID.value) & (UserTenant.role == UserTenantRole.OWNER)))
                    .where(cls.model.status == StatusEnum.VALID.value).dicts())
        
    @classmethod
    @DB.connection_context()
    def get_joined_tenants_by_user_id(cls, user_id):
        fields = [
            cls.model.id.alias("tenant_id"),
            cls.model.name,
            cls.model.llm_id,
            cls.model.embd_id,
            cls.model.asr_id,
            cls.model.img2txt_id,
            UserTenant.role]
        return list(cls.model.select(*fields)
                    .join(UserTenant, on=((cls.model.id == UserTenant.tenant_id) & (UserTenant.user_id == user_id) & (UserTenant.status == StatusEnum.VALID.value) & (UserTenant.role == UserTenantRole.NORMAL)))
                    .where(cls.model.status == StatusEnum.VALID.value).dicts())

    @classmethod
    @DB.connection_context()
    def decrease(cls, user_id, num):
        num = cls.model.update(credit=cls.model.credit - num).where(
            cls.model.id == user_id).execute()
        if num == 0:
            raise LookupError("Tenant not found which is supposed to be there")
        
    @classmethod
    @DB.connection_context()
    def is_tenant_available(cls, tenant_id: str) -> bool:
        query = cls.model.select().where(cls.model.id == tenant_id)
        
        if (len(query) == 1):
            return True
        else:
            return False        