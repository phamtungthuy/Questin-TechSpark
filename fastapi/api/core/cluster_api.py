from fastapi import Request, APIRouter, Query
from db.db_services.knowledgebase_service import KnowledgebaseService
from db.db_services.cluster_service import ClusterService
from db.db_services.document_service import DocumentService
from db.db_services.file2document_service import File2DocumentService
from db.db_services.file_service import FileService
from db.db_services.user_service import UserTenantService
from db.models.file_models import File
from services.conn.storage_factory import STORAGE_IMPL
from db.constants import FileSource
from utils import get_uuid
from utils.api_utils import admin_required, validate_request, get_json_result, get_data_error_result, server_error_response
from api.settings import RetCode, stat_logger

router = APIRouter(tags=["Cluster"])
    
@router.post("/set")
@admin_required
@validate_request("kb_id", "name")
async def set_cluster(request: Request):
    try:
        req = await request.json()
    except Exception as e:
        return get_json_result(data=False, retcode=RetCode.EXCEPTION_ERROR,
                               retmsg=str(e))
    
    is_new = req.get("is_new")
    del req["is_new"]
    req["name"] = req["name"].strip()
    if not is_new:
        cluster_id = req.get("cluster_id")
        del req["cluster_id"]
        try:
            if not ClusterService.update_by_id(cluster_id, req):
                return get_data_error_result(retmsg="Cluster not found!")
            e, cluster = ClusterService.get_by_id(cluster_id)
            if not e:
                return get_data_error_result(
                    retmsg="Fail to update a cluster!"
                )
            cluster = cluster.to_dict()
            return get_json_result(data=cluster)
        except Exception as e:
            return server_error_response(e)
    kb_id = req["kb_id"]
    try:
        user = request.state.user
        req["id"] = get_uuid()
        req["tenant_id"] = user["id"]
        req["created_by"] = user["id"]
        e, kb = KnowledgebaseService.get_by_id(kb_id)
        if not e:
            return get_data_error_result(retmsg="Knowledgebase not found")
        req["embd_id"] = kb.embd_id
        if not ClusterService.save(**req):
            return get_data_error_result()
        e, cluster = ClusterService.get_by_id(req["id"])
        if not e:
            return get_data_error_result(retmsg="Fail to create a new cluster!")
        cluster = cluster.to_dict()
        return get_json_result(data=cluster)
    except Exception as e:
        return server_error_response(e)
    
@router.get("/detail")
@admin_required
@validate_request("kb_id", "cluster_id")
async def detail(request: Request):
    try:
        req = await request.json()
    except Exception as e:
        return get_json_result(data=False, retcode=RetCode.EXCEPTION_ERROR,
                               retmsg=str(e))
    user = request.state.user
    cluster_id = req["cluster_id"]
    kb_id = req["kb_id"]
    try:
        tenants = UserTenantService.query(user_id=user["id"])
        for tenant in tenants:
            if KnowledgebaseService.query(
                    tenant_id=tenant.tenant_id, id=kb_id):
                break
        else:
            return get_json_result(
                data=False, retmsg=f'Only owner of knowledgebase authorized for this operation.',
                retcode=RetCode.OPERATING_ERROR)
        cluster = ClusterService.get_detail(cluster_id)
        if not cluster:
            return get_data_error_result(
                retmsg="Can't find this cluster!"
            )
        return get_json_result(data=cluster)
    except Exception as e:
        return server_error_response(e)
    
@router.get("/list")
@admin_required
async def list_clusters(request: Request,
                   page_number: int = Query(1, alias="page"),
                   items_per_page: int = Query(150, alias="page_size"),
                   orderby: str = Query("create_time", alias="orderby"),
                   desc: bool = Query(True, alias="desc")):

    user = request.state.user
    kb_id = request.query_params.get("kb_id")
    try:
        clusters = ClusterService.get_list(
            kb_id, user["id"], page_number, items_per_page, orderby, desc, None, None
        )
        return get_json_result(data=clusters)
    except Exception as e:
        return server_error_response(e)
    
@router.post("/rm")
@admin_required
@validate_request("cluster_ids")
async def rm(request: Request):
    try:
        req = await request.json()
    except Exception as e:
        return get_json_result(data=False, retcode=RetCode.EXCEPTION_ERROR,
                               retmsg=str(e))
    cluster_ids = req["cluster_ids"]
    user = request.state.user
    try:
        for cluster_id in cluster_ids:
            clusters = ClusterService.query(
                created_by=user["id"], id=cluster_id
            )
            if not clusters:
                return get_json_result(
                    data=False, retmsg=f"Only owner of cluster authorized for this operation",
                    retcode=RetCode.OPERATING_ERROR
                )
                
            for doc in DocumentService.query(cluster_id=cluster_id):
                b, n = File2DocumentService.get_storage_address(doc_id=doc.id)            
                if not DocumentService.remove_document(doc, clusters[0].tenant_id):
                    return get_data_error_result(
                        retmsg="Database error (Document removal)!")
                f2d = File2DocumentService.get_by_document_id(doc.id)
                FileService.filter_delete([File.source_type == FileSource.KNOWLEDGEBASE, File.id == f2d[0].file_id]) 
                File2DocumentService.delete_by_document_id(doc.id)           
                
                STORAGE_IMPL.rm(b, n)
            
            if not ClusterService.delete_by_id(cluster_id):
                return get_data_error_result(
                    retmsg="Database error (Cluster removal)!"
                )
            return get_json_result(data=True)
    except Exception as e:
        return server_error_response(e)
    
    