from datetime import datetime
from db.conn import DB
from db.models.message_models import Message, MessageQA, FacebookMessage
from db.db_services.common_service import CommonService
from playhouse.shortcuts import model_to_dict
from utils import datetime_format, current_timestamp, get_uuid
from db.constants import UserType
from collections import defaultdict

class MessageService(CommonService):
    model = Message
    
    @classmethod
    @DB.connection_context()
    def get_list(cls, conversation_id, page_number,
                 items_per_page, orderby, desc, id):
        messages_query = cls.model.select().where(cls.model.conversation_id == conversation_id)
        if id:
            messages_query = messages_query.where(cls.model.id == id)
        if desc:
            messages_query = messages_query.order_by(cls.model.getter_by(orderby).desc())
        else:
            messages_query = messages_query.order_by(cls.model.getter_by(orderby).asc())
            
        messages_query = messages_query.paginate(page_number, items_per_page)
        if not messages_query:
            return []

        messages = [model_to_dict(msg) for msg in messages_query]
        message_ids = [msg["id"] for msg in messages]
        
        qas_query = MessageQA.select().where(MessageQA.message_id.in_(message_ids))
        qa_dict = {}
        for qa in qas_query:
            qa_data = model_to_dict(qa)
            qa_dict.setdefault(qa_data["message_id"], []).append(qa_data)
        
        for msg in messages:
            msg["qas"] = qa_dict.get(msg["id"], [])
        
        return messages
    
    @classmethod
    @DB.connection_context()
    def add_message(cls, conversation_id, dialog_id, content, sender_id, message_type=UserType.GUEST.value):
        """Thêm một tin nhắn mới vào cuộc hội thoại."""
        message = cls.model.create(
            id = get_uuid(),
            conversation_id=conversation_id,
            dialog_id=dialog_id,
            content=content,
            sender_id=sender_id,
            type=message_type,
        )
        return model_to_dict(message)

class MessageQAService(CommonService):
    model = MessageQA

    @classmethod
    @DB.connection_context()
    def feedback(cls, pid, ans_id, data):
        try:
            obj = cls.model.query(id=pid)[0]

            answer_to_update = next((ans for ans in obj.answer if ans["id"] == ans_id), None)

            if answer_to_update:
                answer_to_update["thumb"] = data["thumb"]
                obj.save()
                return model_to_dict(obj)

            return None
        except Exception as e:
            import traceback
            traceback.print_exc()
            return None
        
        
class FacebookMessageService(CommonService):
    model = FacebookMessage
    
    @classmethod
    @DB.connection_context()
    def get_list(cls, dialog_id, page_number, items_per_page, orderby, desc, id):
        messages_query = cls.model.select().where(cls.model.dialog_id == dialog_id)
        if id:
            messages_query = messages_query.where(cls.model.id == id)
        if desc:
            messages_query = messages_query.order_by(cls.model.getter_by(orderby).desc())
        else:
            messages_query = messages_query.order_by(cls.model.getter_by(orderby).asc())
        
        messages_query = messages_query.paginate(page_number, items_per_page)
        if not messages_query:
            return []

        messages = [model_to_dict(msg) for msg in messages_query]
        return messages
    
    @classmethod
    @DB.connection_context()
    def add_message(cls, id, sender_id, dialog_id, content, reply_to = None):
        message = cls.model.create(
            id=id,
            sender_id=sender_id,
            dialog_id=dialog_id,
            content = content,
            reply_to = reply_to
        )
        return model_to_dict(message)
    
    @classmethod
    @DB.connection_context()
    def get_history(cls, limit):
        messages_query = (cls.model
                          .select()
                          .order_by(cls.model.create_date.desc())
                          .limit(limit))
        
        if not messages_query:
            return []
        
        return [model_to_dict(msg) for msg in messages_query]
    
    
    @classmethod
    @DB.connection_context()
    def get_chat_history(cls, sender_id, limit=5):
        parent_messages = (cls.model
                        .select()
                        .where(
                           (cls.model.reply_to.is_null()) &  
                           (cls.model.sender_id == sender_id)  
                        ) 
                        .order_by(cls.model.create_date.desc())
                        .limit(limit))

        if not parent_messages.exists():
            return []

        parent_ids = [msg.id for msg in parent_messages]

        replies = (cls.model
                .select()
                .where(cls.model.reply_to.in_(parent_ids))
                .order_by(cls.model.create_date.desc()))

        reply_dict = defaultdict(list)
        for reply in replies:
            reply_dict[reply.reply_to].append(reply.content)  

        chat_history = []
        for msg in parent_messages:
            chat_history.append({
                "role": "user",
                "content": msg.content
            })

            if msg.id in reply_dict:
                chat_history.append({
                    "role": "assistant",
                    "content": " ".join(reply_dict[msg.id])  
                })

        return chat_history
    
    @classmethod
    @DB.connection_context()
    def get_one_message(cls, message_id):
        try:
            message = cls.get(cls.id == message_id)
            return model_to_dict(message)
        except cls.DoesNotExist:
            return None
        
