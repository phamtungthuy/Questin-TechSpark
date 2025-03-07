import re
from fastapi import APIRouter, Request, UploadFile, File
from elasticsearch_dsl import Q
from utils.api_utils import (
    admin_required, validate_request, get_json_result, 
    server_error_response, get_data_error_result
)
from db.constants import TaskStatus, FileSource, FileType
from db.models.task_models import Task
from db.models.file_models import File as FileModel
from db.db_services.knowledgebase_service import KnowledgebaseService
from db.db_services.cluster_service import ClusterService
from db.db_services.document_service import DocumentService
from db.db_services.file_service import FileService
from db.db_services.task_service import TaskService, queue_tasks
from db.db_services.file2document_service import File2DocumentService
from api.settings import RetCode
from services.conn.es_conn import ELASTICSEARCH
from services.conn.storage_factory import STORAGE_IMPL
from services.nlp import search
from api.constants import IMG_BASE64_PREFIX

router = APIRouter(tags=['Document'])

@router.post("/upload")
@admin_required
@validate_request("kb_id", "cluster_id")
async def upload(request: Request, file_objs: list[UploadFile] = File(alias="file")):
    try:
        req = await request.form()
    except Exception as e:
        return get_json_result(data=False, retcode=RetCode.EXCEPTION_ERROR,
                               retmsg=str(e))
    user = request.state.user
    kb_id = req["kb_id"]
    cluster_id = req["cluster_id"]
    if not kb_id:
        return get_json_result(
            data=False, retmsg='Lack of "KB ID"', retcode=RetCode.ARGUMENT_ERROR
        )
    file_data = []
    for file_obj in file_objs:
        if file_obj.filename == '':
            return get_json_result(
                data=False, retmsg='No file selected!', retcode=RetCode.ARGUMENT_ERROR
            )
        blob = await file_obj.read()
        file_data.append({
            "filename": file_obj.filename,
            "blob": blob
        })
            

    e, kb = KnowledgebaseService.get_by_id(kb_id)
    if not e:
        raise LookupError("Can't find this knowledgebase!")
    
    e, cluster = ClusterService.get_by_id(cluster_id)
    if not e:
        raise LookupError("Can't find this cluster!")
    
    err, _ = FileService.upload_document(cluster, kb, file_data, user["id"])
    if err:
        return get_json_result(
            data=False, retmsg="\n".join(err), retcode=RetCode.SERVER_ERROR
        )
    return get_json_result(data=True)

@router.get("/list")
@admin_required
async def list_docs(request: Request):
    cluster_id = request.query_params.get("cluster_id")
    if not cluster_id:
        return get_json_result(
            data=False, retmsg="Lack of CLUSTER ID", retcode=RetCode.ARGUMENT_ERROR)
    keywords = request.query_params.get("keywords", "")
    
    page_number = int(request.query_params.get("page", 1))
    items_per_page = int(request.query_params.get("items_per_page", 100))
    orderby = request.query_params.get("orderby", "create_time")
    desc = request.query_params.get("desc", True)
    try:
        docs, tol = DocumentService.get_by_cluster_id(
            cluster_id, page_number, items_per_page, orderby, desc, keywords)
        for doc_item in docs:
            if doc_item["thumbnail"] and not doc_item["thumbnail"].startswith(IMG_BASE64_PREFIX):
                doc_item["thumbnail"] = f"/api/v1/document/image/{doc_item['kb_id']}-{doc_item['thumbnail']}"
        return get_json_result(data={"total": tol, "docs": docs})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return server_error_response(e)
    
@router.get("/infos")
async def docinfos(request: Request):
    try:
        req = await request.json()
    except Exception as e:
        return get_json_result(data=False, retcode=RetCode.EXCEPTION_ERROR,
                               retmsg=str(e))
    doc_ids = req["doc_ids"]
    docs = DocumentService.get_by_ids(doc_ids)
    return get_json_result(data=list(docs.dicts()))

@router.post("/run")
@admin_required
@validate_request("doc_ids", "run")
async def run(request: Request):
    try:
        req = await request.json()
    except Exception as e:
        return get_json_result(data=False, retcode=RetCode.EXCEPTION_ERROR,
                               retmsg=str(e))
    try:
        for id in req["doc_ids"]:
            info = {"run": str(req["run"]), "progress": 0}
            if str(req["run"]) == TaskStatus.RUNNING.value:
                info["progress_msg"] = ""
                info["chunk_num"] = 0
                info["token_num"] = 0
            DocumentService.update_by_id(id, info)
            tenant_id = DocumentService.get_tenant_id(id)
            if not tenant_id:
                return get_data_error_result(retmsg="Tenant not found!")
            ELASTICSEARCH.deleteByQuery(
                Q("match", doc_id=id), idxnm=search.index_name(tenant_id)
            )
            
            if str(req["run"]) == TaskStatus.RUNNING.value:
                TaskService.filter_delete([Task.doc_id == id])
                e, doc = DocumentService.get_by_id(id)
                doc = doc.to_dict()
                doc["tenant_id"] = tenant_id
                bucket, name = File2DocumentService.get_storage_address(doc_id=doc["id"])
                queue_tasks(doc, bucket, name)
            
        return get_json_result(data=True)
    
    except Exception as e:
        return server_error_response(e)
    
@router.post("/rm")
@admin_required
@validate_request("doc_id")
async def rm(request: Request):
    try:
        req = await request.json()
    except Exception as e:
        return get_json_result(data=False, retcode=RetCode.EXCEPTION_ERROR,
                               retmsg=str(e))
    user = request.state.user
    doc_ids = req["doc_id"]
    if isinstance(doc_ids, str): doc_ids = [doc_ids]
    root_folder = FileService.get_root_folder(user["id"])
    pf_id = root_folder["id"]
    FileService.init_knowledgebase_docs(pf_id, user["id"])
    errors = ""
    for doc_id in doc_ids:
        try:
            e, doc = DocumentService.get_by_id(doc_id)
            if not e:
                return get_data_error_result(retmsg="Document not found!")
            tenant_id = DocumentService.get_tenant_id(doc_id)
            if not tenant_id:
                return get_data_error_result(retmsg="Tenant not found!")

            b, n = File2DocumentService.get_storage_address(doc_id=doc_id)

            if not DocumentService.remove_document(doc, tenant_id):
                return get_data_error_result(
                    retmsg="Database error (Document removal)!")

            f2d = File2DocumentService.get_by_document_id(doc_id)
            FileService.filter_delete([FileModel.source_type == FileSource.KNOWLEDGEBASE, FileModel.id == f2d[0].file_id])
            File2DocumentService.delete_by_document_id(doc_id)

            STORAGE_IMPL.rm(b, n)
        except Exception as e:
            import traceback
            traceback.print_exc()
            errors += str(e)

    if errors:
        return get_json_result(data=False, retmsg=errors, retcode=RetCode.SERVER_ERROR)

    return get_json_result(data=True)

@router.post("/change_parser")
@admin_required
@validate_request("doc_id", "parser_id")
async def change_parser(request: Request):
    try:
        req = await request.json()
    except Exception as e:
        return get_json_result(data=False, retcode=RetCode.EXCEPTION_ERROR,
                               retmsg=str(e))
    try:
        e, doc = DocumentService.get_by_id(req["doc_id"])
        if not e:
            return get_data_error_result(retmsg="Document not found!")
        if doc.parser_id.lower() == req["parser_id"].lower():
            if "parser_config" in req:
                if req["parser_config"] == doc.parser_config:
                    return get_json_result(data=True)
            else:
                return get_json_result(data=True)

        if ((doc.type == FileType.VISUAL and req["parser_id"] != "picture")
                or (re.search(
                    r"\.(ppt|pptx|pages)$", doc.name) and req["parser_id"] != "presentation")):
            return get_data_error_result(retmsg="Not supported yet!")

        e = DocumentService.update_by_id(doc.id,
                                         {"parser_id": req["parser_id"], "progress": 0, "progress_msg": "",
                                          "run": TaskStatus.UNSTART.value})
        if not e:
            return get_data_error_result(retmsg="Document not found!")
        if "parser_config" in req:
            DocumentService.update_parser_config(doc.id, req["parser_config"])
        if doc.token_num > 0:
            e = DocumentService.increment_chunk_num(doc.id, doc.kb_id, doc.token_num * -1, doc.chunk_num * -1,
                                                    doc.process_duration * -1)
            if not e:
                return get_data_error_result(retmsg="Document not found!")
            tenant_id = DocumentService.get_tenant_id(req["doc_id"])
            if not tenant_id:
                return get_data_error_result(retmsg="Tenant not found!")
            ELASTICSEARCH.deleteByQuery(
                Q("match", doc_id=doc.id), idxnm=search.index_name(tenant_id))

        return get_json_result(data=True)
    except Exception as e:
        return server_error_response(e)
