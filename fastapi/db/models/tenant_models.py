from db.models import DataBaseModel
from peewee import (
    CharField, IntegerField,
    CompositeKey
)

class Tenant(DataBaseModel):
    id = CharField(max_length=32, primary_key=True)
    name = CharField(max_length=100, null=True, help_text="Tenant name", index=True)
    public_key = CharField(max_length=255, null=True, index=True)
    llm_id = CharField(max_length=128, null=False, help_text="default llm ID", index=True)
    embd_id = CharField(
        max_length=128,
        null=False,
        help_text="default embedding model ID",
        index=True
    )
    asr_id = CharField(
        max_length=128,
        null=False,
        help_text="default ASR model ID",
        index=True
    )
    img2txt_id = CharField(
        max_length=128,
        null=False,
        help_text="default image to text model ID",
        index=True
    )
    rerank_id = CharField(
        max_length=128,
        null=False,
        help_text="default rerank model ID",
        index=True
    )
    tts_id = CharField(
        max_length=256,
        null=True,
        help_text="default tts model ID",
        index=True
    )
    parser_ids = CharField(
        max_length=256,
        null=False,
        help_text="document processors",
        index=True
    )
    credit = IntegerField(default=512, index=True)
    status = CharField(
        max_length=1,
        null=True,
        help_text="is it validate(0: wasted, 1: validate)",
        default="1",
        index=True
    )
    
    class Meta:
        db_table = "tenant"
        
class TenantLLM(DataBaseModel):
    tenant_id = CharField(max_length=32, null=False, index=True)
    llm_factory = CharField(
        max_length=128,
        null=False,
        help_text="LLM factory name",
        index=True
    )
    model_type = CharField(
        max_length=128,
        null=True,
        help_text="LLM, Text Embedding Image2Text, ASR",
        index=True
    )
    llm_name = CharField(
        max_length=128,
        null=True,
        help_text="LLM name",
        default="",
        index=True
    )
    api_key = CharField(max_length=1024, null=True, help_text="API KEY", index=True)
    api_base = CharField(max_length=255, null=True, help_text="API Base")
    
    used_tokens = IntegerField(default=0, index=True)
    
    def __str__(self):
        return self.llm_name
    
    class Meta:
        db_table = "tenant_llm"
        primary_key = CompositeKey('tenant_id', 'llm_factory', 'llm_name')