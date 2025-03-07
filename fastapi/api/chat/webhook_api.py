
#
#                       _oo0oo_
#                      o8888888o
#                      88" . "88
#                      (| -_- |)
#                      0\  =  /0
#                    ___/`---'\___
#                  .' \\|     |// '.
#                 / \\|||  :  |||// \
#                / _||||| -:- |||||- \
#               |   | \\\  -  /// |   |
#               | \_|  ''\---/''  |_/ |
#               \  .-\__  '-'  ___/-. /
#             ___'. .'  /--.--\  `. .'___
#          ."" '<  `.___\_<|>_/___.' >' "".
#         | | :  `- \`.;`\ _ /`;.`/ - ` : | |
#         \  \ `_.   \_ __\ /__ _/   .-` /  /
#     =====`-.____`.___ \_____/___.-`___.-'=====
#                       `=---='
#
#
#     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~



from fastapi import FastAPI, Request, Query, APIRouter
from pydantic import BaseModel
import requests
import os
from fastapi.responses import PlainTextResponse
from fastapi.responses import JSONResponse
from openai import OpenAI
from dotenv import load_dotenv
from db.db_services.dialog_service import DialogService, chat, chat_sql, llm_id2llm_type
# from db.db_services.message_service import GuestMessageService
from agent.agent_v4 import AgentWorkFlow
from api.settings import RetCode
import json
from utils.api_utils import (
    validate_request,
    get_json_result, server_error_response,
    get_data_error_result
)
import asyncio
import httpx
from services.conn.redis_conn import REDIS_CONN
from services.settings import WEBHOOK_QUEUE_NAME

router = APIRouter()
# message_queue = asyncio.Queue()


load_dotenv()

async def send_sender_action(recipient_id: str, action: str):
    payload = {
        "recipient": {"id": recipient_id},
        "sender_action": action,
        "access_token": os.getenv('PAGE_ACCESS_TOKEN')
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(os.getenv('API_URL'), json=payload)
        if response.status_code != 200:
            print(f"Failed to send sender action: {response.text}")


class Message(BaseModel):
    sender_id: str
    message: str

async def send_message(recipient_id: str, text: str):
    url = os.getenv('API_URL')
    headers = {"Content-Type": "application/json"}
    data = {
        "recipient": {"id": recipient_id},
        "message": {"text": text},
        "access_token": os.getenv('PAGE_ACCESS_TOKEN')
    }
    response = requests.post(url, json=data, headers=headers)
    return response.json()

@router.get("/webhook")
async def webhook(request: Request):
    mode = request.query_params.get('hub.mode')
    challenge = request.query_params.get('hub.challenge')
    verify_token = request.query_params.get('hub.verify_token')

    return PlainTextResponse(content=challenge, status_code=200)

@router.get("/webhook/{token}")
async def webhook(request: Request):
    mode = request.query_params.get('hub.mode')
    challenge = request.query_params.get('hub.challenge')
    verify_token = request.query_params.get('hub.verify_token')

    return PlainTextResponse(content=challenge, status_code=200)


@router.post("/webhook")
async def handle_messages(request: Request):
    payload = await request.json()
    print(payload)
    response = JSONResponse(content={"status": "received"}, status_code=200)

    for entry in payload.get("entry", []):
        for event in entry.get("messaging", []):
            sender_id = event.get("sender", {}).get("id")
            message_text = event.get("message", {}).get("text")
            message_id = event.get("message", {}).get("mid")
            reply_to_id = event.get("message", {}).get("reply_to", {}).get("mid")

            if message_id:
                # asyncio.create_task(process_message(sender_id, message_text))
                REDIS_CONN.queue_product(WEBHOOK_QUEUE_NAME, {"sender_id": sender_id, "message_text": message_text, "message_id": message_id, "reply_to_id": reply_to_id})

    return response

@router.post("/webhook/{token}")
async def handle_messages(request: Request):
    payload = await request.json()
    print(payload)
    response = JSONResponse(content={"status": "received"}, status_code=200)

    for entry in payload.get("entry", []):
        for event in entry.get("messaging", []):
            sender_id = event.get("sender", {}).get("id")
            message_text = event.get("message", {}).get("text")
            message_id = event.get("message", {}).get("mid")
            reply_to_id = event.get("message", {}).get("reply_to", {}).get("mid")

            if message_id:
                # asyncio.create_task(process_message(sender_id, message_text))
                REDIS_CONN.queue_product(WEBHOOK_QUEUE_NAME, {"sender_id": sender_id, "message_text": message_text, "message_id": message_id, "reply_to_id": reply_to_id})

    return response

# @router.post("/webhook")
# async def handle_messages(request: Request):
#     payload = await request.json()
#     print(payload)

#     for entry in payload.get("entry", []):
#         for event in entry.get("messaging", []):
#             sender_id = event.get("sender", {}).get("id")
#             message_text = event.get("message", {}).get("text")
#             message_id = event.get("message", {}).get("mid")

#             if sender_id and message_text and message_id:
#                 await message_queue.put((sender_id, message_text))  # Đẩy vào hàng đợi

#     return JSONResponse(content={"status": "received"}, status_code=200)
                
# async def message_worker():
#     while True:
#         sender_id, message_text = await message_queue.get()
#         await process_message(sender_id, message_text)
#         message_queue.task_done()

async def process_message(sender_id, message_text):
    try:
        await send_sender_action(sender_id, "typing_on")

        e, dia = DialogService.get_by_id(os.getenv('DIALOG_ID'))
        if not e:
            print("Dialog not found!")
            return

        workflow = AgentWorkFlow(dia)
        results = []  
        async for res in workflow._run(message_text, []):
            results.append(res)  

        if "response" in results[-1] and "answer" in results[-1]["response"]:
            await send_message(sender_id, results[-1]["response"]["answer"])
        else:
            print("❌ No valid response found!")

    except Exception as err:
        print(f"❌ Error processing message: {err}")

    finally:
        await send_sender_action(sender_id, "typing_off")


# asyncio.create_task(message_worker())

