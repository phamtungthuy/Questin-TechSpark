from db.conn import DB

from db.models.conversation_models import Conversation
from db.db_services.common_service import CommonService

class ConversationService(CommonService):
    model = Conversation
    
    @classmethod
    @DB.connection_context()
    def get_list(cls, dialog_id, page_number,
                 items_per_page, orderby, desc, id, name):
        sessions = cls.model.select().where(cls.model.dialog_id == dialog_id)
        if id:
            sessions = sessions.where(cls.model.id == id)
        if name:
            sessions = sessions.where(cls.model.name == name )
        if desc:
            sessions = sessions.order_by(cls.model.getter_by(orderby).desc())
        else:
            sessions = sessions.order_by(cls.model.getter_by(orderby).asc())
        
        sessions = sessions.paginate(page_number, items_per_page)
        
        return list(sessions.dicts())