from fastapi import APIRouter, Request, Query
from api.settings import RetCode
from db.db_services.message_service import MessageService, MessageQAService
from db.db_services.conversation_service import ConversationService
from utils.api_utils import (
    login_required, server_error_response,
    get_json_result, validate_request
)
router = APIRouter(tags=['Message'])

    
@router.post("/feedback")
@validate_request("answer_id", "qa_id")
async def thumb_message(request: Request):
    try:
        req = await request.json()
    except Exception as e:
        return get_json_result(data=False, retcode=RetCode.EXCEPTION_ERROR,
                               retmsg=str(e))
    
    qa_id = req.get("qa_id")
    ans_id = req.get("answer_id")
    del req["qa_id"]
    del req["answer_id"]
    try:
        if not MessageQAService.feedback(qa_id, ans_id, req):
            return get_json_result(data=False, retmsg="Message not found",
                                   retcode=RetCode.OPERATING_ERROR)
        e, message = MessageQAService.get_by_id(qa_id)
        if not e:
            return get_json_result(data=False, retmsg="Fail to update message!",
                                   retcode=RetCode.OPERATING_ERROR)
        message = message.to_dict()
        return get_json_result(data=message)
    except Exception as e:
        return server_error_response(e)


@router.get('/list')
@login_required
async def list_message(request: Request,
                       page_number: int = Query(1, alias="page"),
                       items_per_page: int = Query(10, alias="itemsPerPage"),
                       orderby: str = Query("create_time", alias="orderBy"),
                       desc: bool = Query(True, alias="desc")):
    conversation_id = request.query_params["conversation_id"]
    try:
        if not ConversationService.query(id=conversation_id):
            return get_json_result(
                data=False, retmsg="Not found conversation",
                retcode=RetCode.OPERATING_ERROR
            )
        messages = MessageService.get_list(
            conversation_id=conversation_id,
            page_number=page_number,
            items_per_page=items_per_page,
            orderby=orderby,
            desc=desc,
            id=None
        )
        return get_json_result(data=messages)
    except Exception as e:
        return server_error_response(e)
    
@router.get("/share/list")
async def list_shared_message(request: Request,
                        page_number: int = Query(1, alias="page"),
                       items_per_page: int = Query(10, alias="itemsPerPage"),
                       orderby: str = Query("create_time", alias="orderBy"),
                       desc: bool = Query(True, alias="desc")):
    conversation_id = request.query_params["conversation_id"]
    try:
        if not ConversationService.query(id=conversation_id, share="1"):
            return get_json_result(
                data=False, retmsg="Not found shared conversation",
                retcode=RetCode.OPERATING_ERROR
            )
        messages = MessageService.get_list(
            conversation_id=conversation_id,
            page_number=page_number,
            items_per_page=items_per_page,
            orderby=orderby,
            desc=desc,
            id=None
        )
        return get_json_result(data=messages)
    except Exception as e:
        return server_error_response(e)