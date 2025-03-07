from db.models import DataBaseModel
from peewee import (
    CharField, TextField
)
from db.db_utils import JSONField
from db.constants import UserType

class Conversation(DataBaseModel):
    id = CharField(max_length=32, primary_key=True)
    dialog_id = CharField(max_length=32, null=False, index=True)
    user_id = CharField(max_length=32, null=False, index=True)
    name = CharField(max_length=255, null=True, help_text="conversation name", index=True)
    share = CharField(
        max_length=1,
        null=True,
        help_text="is it shared to other user(0: wasted, 1: shared)",
        default="0",
        index=True
    )
    type = CharField(null=False, default=UserType.GUEST.value,help_text="conversation type")
    
    class Meta:
        db_table = "conversation"