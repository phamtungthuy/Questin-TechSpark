import os
from enum import Enum

from services.conn.minio_conn import QuestinMinio

class Storage(Enum):
    MINIO = 1
    
class StorageFactory:
    storage_mapping = {
        Storage.MINIO: QuestinMinio
    }
    
    @classmethod
    def create(cls, storage: Storage):
        return cls.storage_mapping[storage]()
    
STORAGE_IMPL_TYPE = os.getenv('STORAGE_IMPL', 'MINIO')
STORAGE_IMPL = StorageFactory.create(Storage[STORAGE_IMPL_TYPE])

