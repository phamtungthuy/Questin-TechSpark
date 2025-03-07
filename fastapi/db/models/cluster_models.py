from db.models import DataBaseModel
from db.constants import ParserType
from peewee import (
    CharField, TextField,
    IntegerField, FloatField
)
from db.db_utils import JSONField

class Cluster(DataBaseModel):
    id = CharField(max_length=32, primary_key=True)
    avatar = TextField(null=True, help_text="avatar base64 string")
    tenant_id = CharField(max_length=32, null=False, index=True)
    kb_id = CharField(max_length=32, null=False, index=True)
    name = CharField(
        max_length=128,
        null=False,
        help_text="KB name",
        index=True
    )
    language = CharField(
        max_length=32,
        null=True,
        default="Vietnamese",
        help_text="Vietnamese|English",
        index=True
    )
    description = TextField(null=True, help_text="KB description")
    embd_id = CharField(
        max_length=128,
        null=False,
        help_text="default embedding model ID",
        index=True
    )
    permission = CharField(
        max_length=16,
        null=False,
        help_text="me|team",
        default="me",
        index=True
    )
    created_by = CharField(max_length=32, null=False, index=True)
    doc_num = IntegerField(default=0, index=True)
    token_num = IntegerField(default=0, index=True)
    chunk_num = IntegerField(default=0, index=True)
    similarity_threshold = FloatField(default=0.2, index=True)
    vector_similarity_weight = FloatField(default=0.7, index=True)
    
    parser_id = CharField(
        max_length=32,
        null=False,
        help_text="default parser ID",
        default=ParserType.NAIVE.value,
        index=True
    )
    parser_config = JSONField(null=False, default={"pages": [[1, 1000000]]})
    status = CharField(
        max_length=1,
        null=True,
        help_text="is it validate(0: wasted, 1: validate)",
        default="1",
        index=True
    )
    
    def __str__(self):
        return self.name
    
    class Meta:
        db_table = "cluster"