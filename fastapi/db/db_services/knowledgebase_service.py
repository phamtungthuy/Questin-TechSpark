from db.conn import DB
from db.db_services.common_service import CommonService
from db.models.knowledgebase_models import Knowledgebase
from db.models.tenant_models import Tenant
from db.constants import StatusEnum, TenantPermission

class KnowledgebaseService(CommonService):
    model = Knowledgebase
    
    @classmethod
    @DB.connection_context()
    def get_by_tenant_ids(cls, joined_tenant_ids, user_id,
                          page_number, items_per_page, orderby, desc):
        """
        Retrieves knowledge base entries by tenant IDs with pagination and ordering.
        Args:
            cls: The class reference.
            joined_tenant_ids (list): List of tenant IDs to filter the knowledge base entries.
            user_id (int): The user ID to filter the knowledge base entries.
            page_number (int): The page number for pagination.
            items_per_page (int): The number of items per page for pagination.
            orderby (str): The field name to order the results by.
            desc (bool): If True, order the results in descending order; otherwise, in ascending order.
        Returns:
            list: A list of dictionaries representing the knowledge base entries.
        """
        kbs = cls.model.select().where(
            ((cls.model.tenant_id.in_(joined_tenant_ids) & (cls.model.permission ==
                                                            TenantPermission.TEAM.value)) | (
                         cls.model.tenant_id == user_id))
            & (cls.model.status == StatusEnum.VALID.value)
        )
        if desc:
            kbs = kbs.order_by(cls.model.getter_by(orderby).desc())
        else:
            kbs = kbs.order_by(cls.model.getter_by(orderby).asc())

        kbs = kbs.paginate(page_number, items_per_page)

        return list(kbs.dicts())
    
    @classmethod
    @DB.connection_context()
    def get_by_tenant_ids_by_offset(cls, joined_tenant_ids, user_id, offset, count, orderby, desc):
        """
        Retrieve knowledge bases by tenant IDs with pagination and ordering.
        Args:
            cls: The class instance.
            joined_tenant_ids (list): List of tenant IDs to filter the knowledge bases.
            user_id (int): The user ID to filter the knowledge bases.
            offset (int): The starting index for pagination.
            count (int): The number of records to retrieve. If -1, retrieves all records from the offset.
            orderby (str): The field name to order the results by.
            desc (bool): If True, orders the results in descending order; otherwise, in ascending order.
        Returns:
            list: A list of dictionaries representing the knowledge bases.
        Raises:
            IndexError: If the offset is out of the valid range.
        """
        kbs = cls.model.select().where(
            ((cls.model.tenant_id.in_(joined_tenant_ids) & (cls.model.permission ==
                                                            TenantPermission.TEAM.value)) | (
                     cls.model.tenant_id == user_id))
            & (cls.model.status == StatusEnum.VALID.value)
        )
        if desc:
            kbs = kbs.order_by(cls.model.getter_by(orderby).desc())
        else:
            kbs = kbs.order_by(cls.model.getter_by(orderby).asc())

        kbs = list(kbs.dicts())

        kbs_length = len(kbs)
        if offset < 0 or offset > kbs_length:
            raise IndexError("Offset is out of the valid range.")

        if count == -1:
            return kbs[offset:]

        return kbs[offset:offset+count]
    
    @classmethod
    @DB.connection_context()
    def get_detail(cls, kb_id):
        fields = [
            cls.model.id,
            #Tenant.embd_id,
            cls.model.embd_id,
            cls.model.avatar,
            cls.model.name,
            cls.model.language,
            cls.model.description,
            cls.model.permission,
            cls.model.cluster_num,
            cls.model.doc_num,
            cls.model.token_num,
            cls.model.chunk_num,
            cls.model.parser_id,
            cls.model.parser_config]
        kbs = cls.model.select(*fields).join(Tenant, on=(
                    (Tenant.id == cls.model.tenant_id) & (Tenant.status == StatusEnum.VALID.value))).where(
            (cls.model.id == kb_id),
            (cls.model.status == StatusEnum.VALID.value)
        )
        if not kbs:
            return
        d = kbs[0].to_dict()
        #d["embd_id"] = kbs[0].tenant.embd_id
        return d

    @classmethod
    @DB.connection_context()
    def update_parser_config(cls, id, config):
        e, m = cls.get_by_id(id)
        if not e:
            raise LookupError(f"knowledgebase({id}) not found.")

        def dfs_update(old, new):
            for k, v in new.items():
                if k not in old:
                    old[k] = v
                    continue
                if isinstance(v, dict):
                    assert isinstance(old[k], dict)
                    dfs_update(old[k], v)
                elif isinstance(v, list):
                    assert isinstance(old[k], list)
                    old[k] = list(set(old[k] + v))
                else:
                    old[k] = v

        dfs_update(m.parser_config, config)
        cls.update_by_id(id, {"parser_config": m.parser_config})

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
    def get_by_name(cls, kb_name, tenant_id):
        kb = cls.model.select().where(
            (cls.model.name == kb_name)
            & (cls.model.tenant_id == tenant_id)
            & (cls.model.status == StatusEnum.VALID.value)
        )
        if kb:
            return True, kb[0]
        return False, None

    @classmethod
    @DB.connection_context()
    def get_all_ids(cls):
        return [m["id"] for m in cls.model.select(cls.model.id).dicts()]

    @classmethod
    @DB.connection_context()
    def get_list(cls, joined_tenant_ids, user_id,
                 page_number, items_per_page, orderby, desc, id , name):
        kbs = cls.model.select()
        if id:
            kbs = kbs.where(cls.model.id == id)
        if name:
            kbs = kbs.where(cls.model.name == name)
        kbs = kbs.where(
            ((cls.model.tenant_id.in_(joined_tenant_ids) & (cls.model.permission ==
                                                            TenantPermission.TEAM.value)) | (
                     cls.model.tenant_id == user_id))
            & (cls.model.status == StatusEnum.VALID.value)
        )
        if desc:
            kbs = kbs.order_by(cls.model.getter_by(orderby).desc())
        else:
            kbs = kbs.order_by(cls.model.getter_by(orderby).asc())

        kbs = kbs.paginate(page_number, items_per_page)

        return list(kbs.dicts())