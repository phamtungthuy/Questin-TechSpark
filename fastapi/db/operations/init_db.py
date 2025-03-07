from db.conn import DB, LOGGER
import inspect
import sys
from db.models import DataBaseModel
from db.operations.migrate import migrate_db
from db.models.user_models import User, UserTenant
from db.models.tenant_models import Tenant, TenantLLM
from db.models.llm_models import LLM, LLMFactories
from db.models.knowledgebase_models import Knowledgebase
from db.models.cluster_models import Cluster
from db.models.dialog_models import Dialog
from db.models.conversation_models import Conversation
from db.models.document_models import Document
from db.models.file_models import File, File2Document
from db.models.task_models import Task
from db.models.message_models import Message, MessageQA, FacebookMessage

@DB.connection_context()
def init_database_tables(alter_fields=[]):
    """
    Initializes database tables by inspecting and creating tables for all classes 
    that are subclasses of DataBaseModel within the current module.

    Args:
        alter_fields (list, optional): List of fields to alter during table creation. Defaults to [].

    Raises:
        Exception: If any table creation fails, an exception is raised with the list of failed tables.

    Logs:
        Logs the start and success of each table creation. If a table creation fails, logs the exception 
        and adds the table to the create_failed_list. Finally, logs and raises an exception if there are 
        any failed table creations.
    """
    members = inspect.getmembers(sys.modules[__name__], inspect.isclass)
    table_objs = []
    create_failed_list = []
    for name, obj in members:
        if obj != DataBaseModel and issubclass(obj, DataBaseModel):
            table_objs.append(obj)
            LOGGER.info(f"start create table {obj.__name__}")
            try:
                obj.create_table()
                LOGGER.info(f"create table success: {obj.__name__}")
            except Exception as e:
                LOGGER.exception(e)
                create_failed_list.append(obj.__name__)
    if create_failed_list:
        LOGGER.info(f"create tables failed: {create_failed_list}")
        raise Exception(f"create tables failed: {create_failed_list}")
    migrate_db()
    