from db.models import DataBaseModel
from peewee import (
    CharField, TextField,
    IntegerField, FloatField,
    DateTimeField
)

from db.db_utils import JSONField

class Document(DataBaseModel):
    id = CharField(max_length=32, primary_key=True)
    thumbnail = TextField(null=True, help_text="thumbnail base64 string")
    kb_id = CharField(max_length=32, null=False, index=True)
    cluster_id = CharField(max_length=32, null=False, index=True)
    parser_id = CharField(
        max_length=32,
        null=False,
        help_text="default parser ID",
        index=True)
    parser_config = JSONField(null=False, default={"pages": [[1, 1000000]]})
    source_type = CharField(
        max_length=128,
        null=False,
        default="local",
        help_text="where dose this document come from",
        index=True)
    type = CharField(max_length=32, null=False, help_text="file extension",
                     index=True)
    created_by = CharField(
        max_length=32,
        null=False,
        help_text="who created it",
        index=True)
    name = CharField(
        max_length=255,
        null=True,
        help_text="file name",
        index=True)
    location = CharField(
        max_length=255,
        null=True,
        help_text="where dose it store",
        index=True)
    size = IntegerField(default=0, index=True)
    token_num = IntegerField(default=0, index=True)
    chunk_num = IntegerField(default=0, index=True)
    progress = FloatField(default=0, index=True)
    progress_msg = TextField(
        null=True,
        help_text="process message",
        default="")
    process_begin_at = DateTimeField(null=True, index=True)
    process_duration = FloatField(default=0)

    run = CharField(
        max_length=1,
        null=True,
        help_text="start to run processing or cancel.(1: run it; 2: cancel)",
        default="0",
        index=True)
    status = CharField(
        max_length=1,
        null=True,
        help_text="is it validate(0: wasted，1: validate)",
        default="1",
        index=True)

    class Meta:
        db_table = "document"