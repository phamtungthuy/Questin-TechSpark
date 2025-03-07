from db.models import DataBaseModel
from peewee import (
    CharField, TextField
)
from db.db_utils import JSONField
from db.constants import UserType


class Message(DataBaseModel):
    id = CharField(max_length=32, primary_key=True)
    conversation_id = CharField(max_length=32, null=True, index=True)
    dialog_id = CharField(max_length=32, null=False, index=True)
    type = CharField(null=False, default=UserType.GUEST.value,help_text="message type")
    
    class Meta:
        db_table = "message"
        
        
class MessageQA(DataBaseModel):
    id = CharField(max_length=32, primary_key=True)
    message_id = CharField(max_length=32, null=False, index=True)
    question = TextField(null=True, help_text="message question")
    answer = JSONField(null=True, help_text="answer", default=[])
    
    class Meta:
        db_table = "message_qa"
        
class FacebookMessage(DataBaseModel):
    id = CharField(max_length=256, primary_key=True)  
    sender_id = CharField(max_length=32, null=True, index=True)
    dialog_id = CharField(max_length=32, null=False, index=True)
    content = TextField(null=True)
    reply_to = CharField(max_length=256, null=True)
    
    class Meta:
        db_table = "message_fb"
        