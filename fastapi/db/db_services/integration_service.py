from datetime import datetime
from db.conn import DB
from db.models.integration_models import Provider, Integration, Credential
from db.db_services.common_service import CommonService
from playhouse.shortcuts import model_to_dict
from utils import datetime_format, current_timestamp, get_uuid
from db.constants import CredentialType, IntegrationType
from collections import defaultdict
from typing import Union


class ProviderService(CommonService):
    model = Provider

    @classmethod
    @DB.connection_context()
    def get_providers(cls):
        query = cls.model.select(cls.model.id, cls.model.name, cls.model.type, cls.model.icon)
        providers = [model_to_dict(provider, only=[cls.model.id, cls.model.name, cls.model.type, cls.model.icon]) for provider in query]
        return providers
        
class CredentialService(CommonService):
    model = Credential

    # @classmethod
    # @DB.connection_context()

        
class IntegrationService(CommonService):
    model = Integration

    @classmethod
    @DB.connection_context()
    def add_integration(cls, **kwargs):
        if "id" not in kwargs:
            kwargs["id"] = get_uuid()
        kwargs["create_time"] = current_timestamp()
        kwargs["create_date"] = datetime_format(datetime.now())
        kwargs["update_time"] = current_timestamp()
        kwargs["update_date"] = datetime_format(datetime.now())
        sample_obj = cls.model(**kwargs).save(force_insert=True)
        return kwargs["id"]
