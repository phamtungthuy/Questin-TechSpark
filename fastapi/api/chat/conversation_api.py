import json
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from db.db_services.message_service import MessageService, MessageQAService
from db.db_services.dialog_service import DialogService, chat, chat_sql, llm_id2llm_type
from db.db_services.conversation_service import ConversationService
from db.db_services.llm_service import LLMBundle
from db.constants import LLMType, UserType
from services.conn.redis_conn import REDIS_CONN
from utils.api_utils import (
    validate_request, login_required,
    get_json_result, server_error_response,
    get_data_error_result, attach_user_info
)
from agent.agent_v4 import AgentWorkFlow
from api.settings import RetCode
from utils import get_uuid
from strenum import StrEnum
import hashlib
import asyncio
from services.settings import es_logger
from datetime import datetime

router = APIRouter()

def get_md5(text: str) -> str:
    return hashlib.md5(text.encode()).hexdigest()

class CompletionType(StrEnum):
    CHAT = "chat"
    SQL = "sql"
    EDIT = "edit"
    TRY_AGAIN = "try_again"
        
def get_cache_key(dia_id, query):
    query_md5 = get_md5(query)
    cache_key = f"completion:{dia_id}:{query_md5}"
    return cache_key
        
def create_message(query, conversation_id, dialog_id, msg_id=None, qa_id=None,
                   type="guest", completion_type=CompletionType.CHAT.value):
    msg_id = get_uuid() if not msg_id else msg_id
    qa_id = get_uuid() if not qa_id else qa_id
    if completion_type == CompletionType.CHAT.value:
        MessageService.save(**{
            "id": msg_id,
            "conversation_id": conversation_id,
            "dialog_id": dialog_id,
            "type": type,
        })
    if completion_type != CompletionType.TRY_AGAIN.value:
        MessageQAService.save(**{
            "id": qa_id,
            "message_id": msg_id,
            "question": query,
            "answer": []
        })
    
    return msg_id, qa_id

def rollback_message(msg_id, qa_id, completion_type=CompletionType.CHAT.value):
    if completion_type == CompletionType.CHAT.value and msg_id:
        try:
            MessageService.delete_by_id(msg_id)
        except Exception as e:
            print("Error rollback message: ", e)
    if completion_type != CompletionType.TRY_AGAIN.value and qa_id:
        try:
            MessageQAService.delete_by_id(qa_id)
        except Exception as e:
            print("Error rollback message qa: ", e)
            
def save_message(answer):
    qa_id = answer.get("qa_id", None)
    if qa_id:
        e, qa = MessageQAService.get_by_id(qa_id)
        if not e:
            return get_data_error_result(retmsg="MessageQA not found!")
        qa = qa.to_dict()
        qa["answer"].append(answer)
        MessageQAService.update_by_id(qa_id, qa)

@router.post("/completion")
@attach_user_info
@validate_request("conversation_id", "query", "history", "type")
async def completions(request: Request):
    try:
        req = await request.form()
    except Exception as e:
        return get_json_result(data=False, retcode=RetCode.EXCEPTION_ERROR,
                               retmsg=str(e))
    user = request.state.user
    # query = req["query"].strip()
    # files = req["files"]
    # conv_id = req["conversation_id"]
    # history = req["history"]
    # type = req["type"]
    # msg_id = req.get("message_id", None)
    # qa_id = req.get("qa_id", None)
    query = req.get("query").strip()
    files = req.getlist("files")
    conv_id = req.get("conversation_id")
    history = json.loads(req.get("history"))
    type = req.get("type")
    msg_id = req.get("message_id", None)
    qa_id = req.get("qa_id", None)
    
    es_logger.info(
        f"Uploaded files {[f.filename for f in files]} at {datetime.now()}" if files else f"No file uploaded at {datetime.now()}"
    )

    try:
        completion_type = CompletionType(type)
    except ValueError as e:
        return get_json_result(data=False, retmsg="**ERROR**" + str(e),
                               retcode=RetCode.OPERATING_ERROR)
    if completion_type == CompletionType.TRY_AGAIN and not msg_id and not qa_id:
        return get_json_result(data=False, retcode=RetCode.EXCEPTION_ERROR,
                               retmsg="message_id is required for TRY_AGAIN completion type.")
    try:
        history = history[-10:]
        e, conv =  ConversationService.get_by_id(conv_id)
        if not e:
            return get_data_error_result(retmsg="Conversation not found!")
         
        if (not user and conv.type == UserType.USER.value) or (user and conv.user_id != user["id"]):
            return get_json_result(
                data=False, retmsg="Only owner of conversation authorized for this operation.",
                retcode=RetCode.OPERATING_ERROR
            )
        e, dia = DialogService.get_by_id(conv.dialog_id)
        cache_key = get_cache_key(conv.dialog_id, query)
        cache_data = REDIS_CONN.get(cache_key)
        msg_id, qa_id = create_message(query, conv_id, dia.id, msg_id, qa_id,
                                       UserType.USER.value if user else UserType.GUEST.value, 
                                       completion_type)
        if cache_data and completion_type == CompletionType.CHAT:
            ans = json.loads(cache_data)
            
            async def cached_stream():
                chunk_size = 10
                content = ans.get("content", "")
                think = ans.get("think", "")
                ans["message_id"] = msg_id
                ans["qa_id"] = qa_id
                ans["conversation_id"] = conv_id
                ans["dialog_id"] = dia.id
                ans["id"] = get_uuid()   
                ans["think"] = ""
                ans["content"] = ""
                for i in range(0, len(think), chunk_size):
                    ans["think"] += think[i: i + chunk_size]
                    yield f"data:{json.dumps({'retcode': 0, 'retmsg': '', 'data': ans}, ensure_ascii=False)}\n\n"
                    await asyncio.sleep(0.02)
                for i in range(0, len(content), chunk_size):
                    ans["content"] += content[i: i + chunk_size]
                    yield f"data:{json.dumps({'retcode': 0, 'retmsg': '', 'data': ans}, ensure_ascii=False)}\n\n"
                    await asyncio.sleep(0.02)
                save_message(ans)
            headers = {
                "Cache-control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
                "Content-Type": "text/event-stream; charset=utf-8"
            }
            return StreamingResponse(cached_stream(), headers=headers)

        workflow = AgentWorkFlow(dia)
        ans = {
            "message_id": msg_id,
            "qa_id": qa_id,
            "conversation_id": conv_id,
            "dialog_id": dia.id,
            "content": "",
            "think": "",
            "reference": {},
            "thumb": "0",
            "feedback": "",
            "id": get_uuid(),
            "status": "",
            "citation": ""
        }
        
        def fillin_conv(res):
            nonlocal ans
            ans["content"] = res["response"]["answer"]
            ans["reference"] = res["response"]["reference"]
            ans["think"] = res["think"]
            ans["citation"] = res["citation"]
            ans["status"] = res["state_msg"]
            
        async def stream():
            nonlocal query, history, ans, msg_id, qa_id, completion_type
            try:
                try:
                    async for res in workflow._run(query, history):
                        fillin_conv(res)
                        try:
                            yield "data:" + json.dumps({"retcode": 0, "retmsg": "", "data": ans}, ensure_ascii=False) + "\n\n"
                        except ConnectionResetError:
                            print("Client disconnected")
                            break
                    REDIS_CONN.set_obj(cache_key, ans, exp=60)
                    save_message(ans)
                except ConnectionError:
                    print("Client disconnected")
            except Exception as e:
                rollback_message(msg_id, qa_id, completion_type)
                ans["content"] += "\n**ERROR**" + str(e)
                yield "data:" + json.dumps({"retcode": 500, "retmsg": str(e),
                                            "data": ans},
                                           ensure_ascii=False) + "\n\n"
        headers = {
            "Cache-control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Content-Type": "text/event-stream; charset=utf-8"
        }
        resp = StreamingResponse(stream(), headers=headers)
        return resp
                
    except Exception as e:
        rollback_message(msg_id, qa_id, completion_type)
        
# @router.post("/completion")
# @login_required
# @validate_request("conversation_id", "messages")
# async def completions(request: Request):
#     try:
#         req = await request.json()
#     except Exception as e:
#         return get_json_result(data=False, retcode=RetCode.EXCEPTION_ERROR,
#                                retmsg=str(e)) 
#     user = request.state.user
#     msg = []
#     for m in req["messages"]:
#         if m["role"] == "system":
#             continue
#         if m["role"] == "assistant" and not msg:
#             continue
#         msg.append(m)
#     if msg[-1]["role"] == "assistant":
#         del msg[-1]
#     messages = req["messages"]
#     try:
#         e, conv = ConversationService.get_by_id(req["conversation_id"])
#         if not e:
#             return get_data_error_result(retmsg="Conversation not found!")
#         if conv.user_id != user["id"]:
#             return get_json_result(
#                 data=False, retmsg="Only owner of conversation authorized for this operation.",
#                 retcode=RetCode.OPERATING_ERROR
#             )
#         e, dia = DialogService.get_by_id(conv.dialog_id)
#         if not e:
#             return get_data_error_result(retmsg="Dialog not found!")
#         del req["conversation_id"]
#         del req["messages"]

#         def fillin_conv(ans):
#             nonlocal messages
#             messages[-1]["content"] = ans["answer"]
#             messages[-1]["reference"] = ans["reference"]
#             ans["id"] = messages[-1]["id"]
        
#         def stream():
#             nonlocal dia, msg
#             try:
#                 for ans in chat(dia, msg, True, **req):
#                     fillin_conv(ans)
#                     yield "data:" + json.dumps({"retcode": 0, "retmsg": "", "data": ans},
#                                            ensure_ascii=False) + "\n\n"
#                 for message in messages: 
#                     MessageService.update_by_id(message["id"], message)
#             except Exception as e:
#                 rollback_message(messages)
#                 yield "data:" + json.dumps({"retcode": 500, "retmsg": str(e),
#                                             "data": {"answer": "**ERROR**" + str(e), "reference": []}},
#                                            ensure_ascii=False) + "\n\n"
#             yield "data:" + json.dumps({"retcode": 0, "retmsg": "", "data": True}, ensure_ascii=False) + "\n\n" 
        
#         if req.get("stream", True):
#             if req.get("stream"):
#                 del req["stream"]
#             headers = {
#                 "Cache-control": "no-cache",
#                 "Connection": "keep-alive",
#                 "X-Accel-Buffering": "no",
#                 "Content-Type": "text/event-stream; charset=utf-8"
#             }
#             resp = StreamingResponse(stream(), headers=headers)
#             return resp
#         else:
#             answer = None
#             for ans in chat(dia, msg, **req):
#                 answer = ans
#                 fillin_conv(ans)
#                 for message in messages: 
#                     MessageService.update_by_id(message["id"], message)
#                 break
#             return get_json_result(data=answer)
        
#     except Exception as e:
#         rollback_message(message)
#         return server_error_response(e)
    
@router.post("/completion/sql")
@login_required
@validate_request("conversation_id", "messages")
async def completions_sql(request: Request):
    try:
        req = await request.json()
    except Exception as e:
        return get_json_result(data=False, retcode=RetCode.EXCEPTION_ERROR,
                               retmsg=str(e)) 
    user = request.state.user
    messages = req["messages"]
    msg = []
    for m in req["messages"]:
        if m["role"] == "system":
            continue
        if m["role"] == "assistant" and not msg:
            continue
        msg.append(m)
    if msg[-1]["role"] == "assistant":
        del msg[-1]
    questions = [m["content"] for m in msg if m["role"] == "user"][-3:]
    try:
        e, conv = ConversationService.get_by_id(req["conversation_id"])
        if not e:
            return get_data_error_result(retmsg="Conversation not found!")
        if conv.user_id != user["id"]:
            return get_json_result(
                data=False, retmsg="Only owner of conversation authorized for this operation.",
                retcode=RetCode.OPERATING_ERROR
            )
        e, dia = DialogService.get_by_id(conv.dialog_id)
        if not e:
            return get_data_error_result(retmsg="Dialog not found!")
        answer = None
        for ans in chat_sql(dia, questions[-1]):
            answer = ans
            if answer is not None:
                answer["content"] = answer["answer"]
                del answer["answer"]
                MessageService.update_by_id(messages[-1]["id"], {
                    "versions": {
                        "versions": [answer]
                    }
                })
            break
        if answer is not None:
            return get_json_result(data={
                "id": messages[-1]["id"],
                "versions": {
                    "versions": [answer]
                }
            })
        return get_json_result(data=answer)
    except Exception as e:
        return server_error_response(e)

@router.post("/completion/title")
@login_required
@validate_request("conversation_id", "messages")
async def completion_title(request: Request):
    try:
        req = await request.json()
    except Exception as e:
        return get_json_result(data=False, retcode=RetCode.EXCEPTION_ERROR,
                               retmsg=str(e))
    user = request.state.user
    msg = []
    for m in req["messages"]:
        msg.append({
            "role": m["role"],
            "content": m["content"]
        })
    try:
        conversation_id = req["conversation_id"]
        e, conv = ConversationService.get_by_id(req["conversation_id"])
        if not e:
            return get_data_error_result(retmsg="Conversation not found!")
        if conv.user_id != user["id"]:
            return get_json_result(
                data=False, retmsg="Only owner of conversation authorized for this operation.",
                retcode=RetCode.OPERATING_ERROR
            )
        e, dia = DialogService.get_by_id(conv.dialog_id)
        if not e:
            return get_data_error_result(retmsg="Dialog not found!")
        gen_conf = dia.llm_setting
        if llm_id2llm_type(dia.llm_id) == "image2text":
            chat_mdl = LLMBundle(dia.tenant_id, LLMType.IMAGE2TEXT, dia.llm_id)
        else:
            chat_mdl = LLMBundle(dia.tenant_id, LLMType.CHAT, dia.llm_id)
        prompt = """Tôi cần bạn tạo một tiêu đề ngắn cho cuộc trò chuyện này. Tiêu đề nên:
- Tóm tắt nội dung chính.
- Dễ hiểu.
- Có sức hút."""
        
        def stream():
            answer = ""
            for ans in chat_mdl.chat_streamly(prompt, msg, gen_conf):
                answer = ans
                yield "data:" + json.dumps({"retcode": 0, "retmsg": "", "data": {
                    "answer": ans,
                    "id": conversation_id
                }}, ensure_ascii=False) + "\n\n"
            ConversationService.update_by_id(conversation_id, {
                "name": answer
            })
        
        if req.get("stream", True):
            headers = {
                "Cache-control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
                "Content-Type": "text/event-stream; charset=utf-8"
            }
            resp = StreamingResponse(stream(), headers=headers)
            return resp
        else:
            answer = chat_mdl.chat(prompt, msg, {
                **gen_conf,
                "max_tokens": 30
            })
            ConversationService.update_by_id(conversation_id, {
                "name": answer
            })
            return get_json_result(data={
                "answer": answer,
                "id": conversation_id
            })
    except Exception as e:
        return server_error_response(e)
