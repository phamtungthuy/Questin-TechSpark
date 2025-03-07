from db.conn import DB
from db.db_services.common_service import CommonService
from db.db_services.knowledgebase_service import KnowledgebaseService
from db.models.cluster_models import Cluster
from db.models.knowledgebase_models import Knowledgebase
from db.constants import StatusEnum, TenantPermission

class ClusterService(CommonService):
    model = Cluster

    @classmethod
    @DB.connection_context()
    def get_detail(cls, cluster_id):
        fields = [
            cls.model.id,
            #Tenant.embd_id,
            cls.model.embd_id,
            cls.model.avatar,
            cls.model.name,
            cls.model.language,
            cls.model.description,
            cls.model.permission,
            cls.model.doc_num,
            cls.model.token_num,
            cls.model.chunk_num,
            cls.model.parser_id,
            cls.model.parser_config]
        clusters = cls.model.select(*fields).join(Knowledgebase, on=(
                    (Knowledgebase.id == cls.model.kb_id))).where(
            (cls.model.id == cluster_id),
            (cls.model.status == StatusEnum.VALID.value)
        )
        if not clusters:
            return
        d = clusters[0].to_dict()
        #d["embd_id"] = kbs[0].tenant.embd_id
        return d

    @classmethod
    @DB.connection_context()
    def save(cls, **kwargs):
        e, kb = KnowledgebaseService.get_by_id(kwargs["kb_id"])
        if not KnowledgebaseService.update_by_id(kb.id, {"cluster_num": kb.cluster_num + 1}):
            raise RuntimeError("Database error (Cluster)!")
        return super().save(**kwargs)

    @classmethod
    @DB.connection_context()
    def get_field_map(cls, ids):
        conf = {}
        for k in cls.get_by_ids(ids):
            if k.parser_config and "field_map" in k.parser_config:
                conf.update(k.parser_config["field_map"])
        return conf
    
    @classmethod
    @DB.connection_context()
    def get_by_name(cls, cluster_name, kb_id):
        cluster = cls.model.select().where(
            (cls.model.name == cluster_name)
            & (cls.model.kb_id == kb_id)
            & (cls.model.status == StatusEnum.VALID.value)
        )
        if cluster:
            return True, cluster[0]
        return False, None
        
    @classmethod
    @DB.connection_context()
    def get_all_ids(cls):
        return [m["id"] for m in cls.model.select(cls.model.id).dicts()]
        
    @classmethod
    @DB.connection_context()
    def get_list(cls, kb_id, user_id,
                 page_number, items_per_page, orderby, desc, id, name):
        clusters = cls.model.select()
        if id:
            clusters = clusters.where(cls.model.id == id)
        if name:
            clusters = clusters.where(cls.model.name == name)
        clusters = clusters.where(
            (cls.model.kb_id == kb_id)
            & (cls.model.permission == TenantPermission.TEAM | 
             cls.model.permission == TenantPermission.ME)
            & (cls.model.created_by == user_id)
            & (cls.model.status == StatusEnum.VALID.value)
        )
        if desc:
            clusters = clusters.order_by(cls.model.getter_by(orderby).desc())
        else:
            clusters = clusters.order_by(cls.model.getter_by(orderby).asc())
            
        clusters = clusters.paginate(page_number, items_per_page)
        
        return list(clusters.dicts())