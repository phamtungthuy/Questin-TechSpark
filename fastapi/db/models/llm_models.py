from db.models import DataBaseModel
from peewee import (
    CharField, TextField,
    IntegerField, CompositeKey
)

class LLMFactories(DataBaseModel):
    name = CharField(
        max_length=128,
        null=False,
        help_text="LLM factory name",
        primary_key=True
    )
    logo = TextField(null=True, help_text="llm logo base64")
    tags = CharField(
        max_length=255,
        null=False,
        help_text="LLM, Text Embedding, Image2Text, ASR"
    )
    status = CharField(
        max_length=1,
        null=True,
        help_text="is it validate(0: successful, 1: validate)",
        default="1",
        index=True
    )
    
    def __str__(self):
        return self.name
    
    class Meta:
        db_table = "llm_factories"
        
class LLM(DataBaseModel):
    llm_name = CharField(
        max_length=128,
        null=True,
        help_text="LLM name",
        index=True
    )
    model_type = CharField(
        max_length=128,
        null=False,
        help_text="LLM, Text Embedding, Image2Text, ASR",
        index=True
    )
    fid = CharField(max_length=128, null=False, help_text="LLM factory id", index=True)
    max_tokens = IntegerField(default=0)
    
    tags = CharField(
        max_length=255,
        null=False,
        help_text="LLM, Text Embedding, Image2Text, Chat, 32k..."
    )
    status = CharField(
        max_length=1,
        null=True,
        help_text="is it validate(0: wasted, 1: validate)",
        default="1",
        index=True
    )
    
    def __str__(self):
        return self.llm_name
    
    class Meta:
        primary_key = CompositeKey('fid', 'llm_name')
        db_table = "llm"
        
