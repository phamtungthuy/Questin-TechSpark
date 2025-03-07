from db.models import DataBaseModel
from peewee import (
    CharField, TextField,
    FloatField, IntegerField
)
from db.db_utils import JSONField

class Dialog(DataBaseModel):
    id = CharField(max_length=32, primary_key=True)
    tenant_id = CharField(max_length=32, null=False, index=True)
    name = CharField(
        max_length=255,
        null=True,
        help_text="dialog application name",
        index=True)
    description = TextField(null=True, help_text="Dialog description")
    icon = TextField(null=True, help_text="icon base64 string")
    language = CharField(
        max_length=32,
        null=True,
        default="Vietnamese",
        help_text="Vietnamese|English",
        index=True
    )
    llm_id = CharField(max_length=128, null=False, help_text="default llm ID")
    
    llm_setting = JSONField(null=False, default={"temperature": 0.1, "top_p": 0.3, "frequency_penalty": 0.7,
                                                 "presence_penalty": 0.4, "max_tokens": 512})
    
    prompt_type = CharField(
        max_length=16,
        null=False,
        default="simple",
        help_text="simple|advanced",
        index=True
    )
    prompt_config = JSONField(null=False, default={"system": "", "prologue": "Xin chào, tôi là trợ lý của bạn, tôi có thể giúp gì cho bạn?", 
                                                   "parameters": [], "empty_response": "Xin lỗi! Không tìm thấy nội dung liên quan trong cơ sở kiến thức!"})
    
    similarity_threshold = FloatField(default=0.2)
    vector_similarity_weight = FloatField(default=0.7)
    
    top_n = IntegerField(default=6)
    top_k = IntegerField(default=1024)
    
    do_refer = CharField(
        max_length=1,
        null=False,
        default="1",
        help_text="it needs to insert reference index into answer or not"
    )
    
    rerank_id = CharField(
        max_length=128,
        null=False,
        help_text="default rerank model ID"
    )
    
    kb_ids = JSONField(null=False, default=[])
    status = CharField(
        max_length=1,
        null=True,
        help_text="is it validate(0: wasted, 1: validate)",
        default="1",
        index=True
    )
    
    class Meta:
        db_table = "dialog"