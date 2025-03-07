from db.models import DataBaseModel
from peewee import (
    CharField, IntegerField, DateTimeField,
    FloatField, TextField
)

class Task(DataBaseModel):
    id = CharField(max_length=32, primary_key=True)
    doc_id = CharField(max_length=32, null=False, index=True)
    from_page = IntegerField(default=0)

    to_page = IntegerField(default=-1)

    begin_at = DateTimeField(null=True, index=True)
    process_duration = FloatField(default=0)

    progress = FloatField(default=0, index=True)
    progress_msg = TextField(
        null=True,
        help_text="process message",
        default="")
    retry_count = IntegerField(default=0)