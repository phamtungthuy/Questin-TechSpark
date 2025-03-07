from db.models import DataBaseModel
from peewee import (
    CharField, TextField,
    FloatField, IntegerField, BooleanField
)
from db.db_utils import JSONField
from db.constants import IntegrationType, CredentialType


class Provider(DataBaseModel):
    id = CharField(max_length=32, primary_key=True)
    name = CharField(max_length=64, null=False, index=True)
    icon = CharField(max_length=256, null=False, index=True)
    status = BooleanField()
    type = CharField(choices=[(t.value, t.name) for t in IntegrationType]) 

    class Meta:
        db_table = "provider"

class Credential(DataBaseModel):
    id = CharField(max_length=32, primary_key=True)
    name = CharField(max_length=64, null=False, index=True)
    type = CharField(choices=[(t.value, t.name) for t in CredentialType]) 
    value = TextField()
    status = BooleanField()
    integration_id = CharField(max_length=32)

    class Meta:
        db_table = "credential"
        
class Integration(DataBaseModel):
    id = CharField(max_length=32, primary_key=True)
    name = CharField(max_length=64, null=False, index=True)
    provider_id = CharField(max_length=32)
    dialog_id = CharField(max_length=32)
    tenant_id = CharField(max_length=32)
    status = BooleanField()
    
    class Meta:
        db_table = "integration"