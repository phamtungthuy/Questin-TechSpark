from datetime import datetime

from db.conn import DB 
from db.db_services.common_service import CommonService
from db.db_services.document_service import DocumentService
from db.models.file_models import File2Document, File
from db.constants import FileSource

from utils import current_timestamp, datetime_format

class File2DocumentService(CommonService):
    model = File2Document
    
    @classmethod
    @DB.connection_context()
    def get_by_file_id(cls, file_id):
        objs = cls.model.select().where(cls.model.file_id == file_id)
        return objs
    
    @classmethod
    @DB.connection_context()
    def get_by_document_id(cls, document_id):
        objs = cls.model.select().where(cls.model.document_id == document_id)
        return objs
    
    @classmethod
    @DB.connection_context()
    def insert(cls, obj):
        if not cls.save(**obj):
            raise RuntimeError("Database error (File)!")
        e, obj = cls.get_by_id(obj["id"])
        if not e:
            raise RuntimeError("Database error (File Retrieval)!")
        return obj
    
    @classmethod
    @DB.connection_context()
    def delete_by_file_id(cls, file_id):
        return cls.model.delete().where(cls.model.file_id == file_id).execute()

    @classmethod
    @DB.connection_context()
    def delete_by_document_id(cls, doc_id):
        return cls.model.delete().where(cls.model.document_id == doc_id).execute()

    @classmethod
    @DB.connection_context()
    def update_by_file_id(cls, file_id, obj):
        obj["update_time"] = current_timestamp()
        obj["update_date"] = datetime_format(datetime.now())
        num = cls.model.update(obj).where(cls.model.id == file_id).execute()
        e, obj = cls.get_by_id(cls.model.id)
        return obj
    
    
    @classmethod
    @DB.connection_context()
    def get_storage_address(cls, doc_id=None, file_id=None):
        if doc_id:
            f2d = cls.get_by_document_id(doc_id)
        else:
            f2d = cls.get_by_file_id(file_id)
        if f2d:
            file = File.get_by_id(f2d[0].file_id)
            if not file.source_type or file.source_type == FileSource.LOCAL:
                return file.parent_id, file.location
            doc_id = f2d[0].document_id

        assert doc_id, "please specify doc_id"
        e, doc = DocumentService.get_by_id(doc_id)
        return doc.kb_id, doc.location
