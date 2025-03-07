from playhouse.migrate import MySQLMigrator, migrate
from peewee import CharField
from db.db_utils import JSONField
from db.conn import DB
from db.constants import UserType
import traceback

def migrate_db():
    with DB.transaction():
        migrator = MySQLMigrator(DB)

        try:
            migrate(
                migrator.add_column('conversation', 'type', 
                                           CharField(null=False, default=UserType.USER.value,help_text="conversation type"))
            )
        except Exception as e:
            print(e)
            pass

        try:
            migrate(
                migrator.add_column('cluster', 'tenant_id', 
                                           CharField(max_length=32, null=False, index=True, default=""))
            )
            from db.models.cluster_models import Cluster
            from db.models.knowledgebase_models import Knowledgebase
            for cluster in Cluster.select():
                kb = Knowledgebase.get_by_id(cluster.kb_id)
                cluster.tenant_id = kb.tenant_id
                cluster.save()
            
        except Exception as e:
            print(e)
            pass 
    
        
        try:
            migrate(
                migrator.add_column("conversation", "share", CharField(max_length=1, null=True, 
                                    help_text="is it shared to other user(0: wasted, 1: shared)", default="0", index=True))
            )
        except Exception as e:
            print(e)
            pass
        
        try:
            if not DB.table_exists("message_old"):
                migrate(migrator.rename_table("message", "message_old"))
                from db.models.message_models import Message
                DB.create_tables([Message])
        except Exception as e:
            print(e)
            pass