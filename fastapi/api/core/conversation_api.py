import json
from fastapi import APIRouter, Request
from api.settings import RetCode
from db.models.message_models import Message
from db.db_services.dialog_service import DialogService
from db.constants import UserType
from db.db_services.conversation_service import ConversationService
from db.db_services.message_service import MessageService
from utils import get_uuid
from utils.api_utils import (
    login_required,get_json_result, 
    server_error_response, get_data_error_result, attach_user_info
)


router = APIRouter(tags=['Conversation'])

@router.post("/set")
@attach_user_info
async def set_conversation(request: Request):
    try:
        req = await request.json()
    except Exception as e:
        return get_json_result(data=False, retcode=RetCode.EXCEPTION_ERROR,
                               retmsg=str(e))
    is_new = req.get("is_new")
    del req["is_new"]
    if not is_new:
        conv_id = req.get("conversation_id")
        del req["conversation_id"]
        try:
            if not ConversationService.update_by_id(conv_id, req):
                return get_data_error_result(retmsg="Conversation not found!")
            e, conv = ConversationService.get_by_id(conv_id)
            if not e:
                return get_data_error_result(
                    retmsg="Fail to update a conversation!"
                )
            conv = conv.to_dict()
            return get_json_result(data=conv)
        except Exception as e:
            return server_error_response(e)
    
    try:
        user = request.state.user
        e, dia = DialogService.get_by_id(req["dialog_id"])
        if not e:
            return get_data_error_result(retmsg="Dialog not found!")
        conv = {
            "id": get_uuid(),
            "dialog_id": req["dialog_id"],
            "user_id": user["id"] if user else request.client.host,
            "name": req.get("name", "New conversation"),
            "message": [{"role": "assistant", "content": dia.prompt_config["prologue"]}],
            "type": UserType.USER.value if user else UserType.GUEST.value
        }
        ConversationService.save(**conv)
        e, conv = ConversationService.get_by_id(conv["id"])
        if not e:
            return get_data_error_result(retmsg="Fail to create a new conversation!")
        conv = conv.to_dict()
        return get_json_result(data=conv)
    except Exception as e:
        return server_error_response(e)
    
@router.get("/get")
@login_required
async def get(request: Request):
    conv_id = request.query_params["conversation_id"]
    user = request.state.user
    try:
        e, conv = ConversationService.get_by_id(conv_id)
        if not e:
            return get_data_error_result(retmsg="Conversation not found!")
        if conv.user_id != user["id"]:
            return get_json_result(
                data=False, retmsg="Only owner of conversation authorized for this operation.",
                retcode=RetCode.OPERATING_ERROR
            )
        conv = conv.to_dic()
        return get_json_result(data=conv)
    except Exception as e:
        return server_error_response(e)

@router.get("/list")
@login_required
async def list_conversation(request: Request):
    dialog_id = request.query_params["dialog_id"]
    try:
        if not DialogService.query(id=dialog_id):
            return get_json_result(
                data=False, retmsg="Not found dialog",
                retcode=RetCode.OPERATING_ERROR
            )
        user = request.state.user
        convs = ConversationService.query(
            dialog_id=dialog_id,
            user_id=user["id"],
            order_by=ConversationService.model.update_time
        )
        convs = [d.to_dict() for d in convs]
        return get_json_result(data=convs)
    except Exception as e:
        return server_error_response(e)

@router.post("/rm")
@login_required
async def rm(request: Request):
    try:
        req = await request.json()
    except Exception as e:
        return get_json_result(data=False, retcode=RetCode.EXCEPTION_ERROR,
                               retmsg=str(e))
    conv_ids = req.get("conversation_ids")
    user = request.state.user
    try:
        for conv_id in conv_ids:
            exist, conv = ConversationService.get_by_id(conv_id)
            if not exist:
                return get_data_error_result(retmsg="Conversation not found!")
            if conv.user_id != user["id"]:
                return get_json_result(
                    data=False, retmsg=f"Only owner of conversation authorized for this operation."
                )
            MessageService.filter_delete([Message.conversation_id == conv_id])
            ConversationService.delete_by_id(conv_id)
        return get_json_result(data=True)
    except Exception as e:
        return server_error_response(e)