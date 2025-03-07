

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

from services.settings import WEBHOOK_QUEUE_NAME
from services.conn.redis_conn import REDIS_CONN, Payload
import time
import os
from concurrent.futures import ThreadPoolExecutor
from db.db_services.dialog_service import DialogService, chat, chat_sql, llm_id2llm_type
# from db.db_services.message_service import GuestMessageService
from agent.agent_messenger import AgentWorkFlow
from db.db_services.message_service import MessageService, FacebookMessageService
import httpx
import requests
import json
from timeit import default_timer as timer
import asyncio
from services.settings import cron_logger
from dotenv import load_dotenv
from db.constants import UserType



CONSUMER_NAME = "webhook_consumer"
PAYLOAD: Payload | None = None

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

def delete_asterisk(text: str) -> str:
    """
    Delete all asterisk(*) in text.
    
    :param text: input string
    :return: a string which contains no asterisk
    """
    return text.replace("*", "")
    

def split_text(text: str, max_length: int = 640) -> list[str]:
    """Split text into chunks with priority:
    1. Split by newlines first
    2. Split long lines into <= max_length chunks
    3. Try to preserve word boundaries when possible"""
    
    chunks = []
    
    # First split by newlines
    lines = text.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:  # Skip empty lines
            continue
            
        # If line is within limit
        if len(line) <= max_length:
            chunks.append(line)
            continue
            
        # Split long line into words
        words = line.split()
        current_chunk = []
        current_length = 0
        
        for word in words:
            # Check if adding word would exceed limit
            if current_length + len(word) + len(current_chunk) > max_length:
                if current_chunk:
                    chunks.append(' '.join(current_chunk))
                    current_chunk = []
                    current_length = 0
                
                # Handle very long single word
                if len(word) > max_length:
                    chunks.extend([word[i:i+max_length] for i in range(0, len(word), max_length)])
                    continue
                    
            current_chunk.append(word)
            current_length += len(word)
            
        if current_chunk:
            chunks.append(' '.join(current_chunk))
    
    return chunks

async def send_message(recipient_id, message_id: str, text: str):
    url = os.getenv('API_URL')
    chunks = split_text(text)
    
    async with httpx.AsyncClient() as client:
        for chunk in chunks:
            chunk = delete_asterisk(chunk)
            data = {
                "recipient": {"id": recipient_id},
                "message": {"text": chunk},
                "access_token": os.getenv('PAGE_ACCESS_TOKEN')
            }
            response = await client.post(url, json=data)
            response_data = response.json()
            
            FacebookMessageService.add_message(
                id = response_data.get('message_id'),
                sender_id='rndaa',
                dialog_id=os.getenv('DIALOG_ID'),
                content = chunk,
                reply_to=message_id,
            )
            
            await asyncio.sleep(1) 
            
            if response.status_code != 200:
                print(f"Failed to send message chunk: {response.text}")

async def process_message(sender_id, message_text, message_id, reply_to_id=None):
    try:
        await send_sender_action(sender_id, "typing_on")        
        
        data = {}
        if reply_to_id:
            data = FacebookMessageService.get_one_message(message_id=reply_to_id) or {}

        if reply_to_id and isinstance(data, dict) and 'content' in data:
            quote = f"<QUOTE>{data['content']}<QUOTE>"
            message_text = f"{quote} {message_text}"
            
            
        history = FacebookMessageService.get_chat_history(
                                            sender_id = sender_id,
                                            limit = 5) or []
                
        e, dia = DialogService.get_by_id(os.getenv('DIALOG_ID'))
        if not e:
            print("Dialog not found!")
            return

        workflow = AgentWorkFlow(dia)
        result = ""
        async for res in workflow._run(message_text, history):
            result = res
        
        if "response" in result and "answer" in result["response"]:
            
            FacebookMessageService.add_message(
                id = message_id,
                sender_id=sender_id,
                dialog_id=os.getenv('DIALOG_ID'),   
                content = message_text,
            )
            
            await send_message(sender_id ,message_id, result["response"]["answer"])
            
            
        else:
            print("❌ No valid response found!")

    except Exception as err:
        print(f"❌ Error processing message: {err}")

    finally:
        await send_sender_action(sender_id, "typing_off")


async def collect():
    global CONSUMER_NAME, PAYLOAD
    try:
        PAYLOAD = REDIS_CONN.get_unacked_for(CONSUMER_NAME, WEBHOOK_QUEUE_NAME, "questin_webhook_task_broker")
        if not PAYLOAD:
            PAYLOAD = REDIS_CONN.queue_consumer(WEBHOOK_QUEUE_NAME, "questin_webhook_task_broker", CONSUMER_NAME)
        if not PAYLOAD:
            time.sleep(1)
            return

    except Exception as e:
        # cron_logger.error("Get task event from queue exception:" + str(e))
        # return pd.DataFrame()
        print(e)
    
    msg = PAYLOAD.get_message()
    
    # FacebookMessageService.add_message(
    #     id=msg['message_id'],
    #     sender_id=msg['sender_id'],
    #     dialog_id=os.getenv("DIALOG_ID"),
    #     question=msg['message_text'],
    #     answer=
    # )
    
    if msg['reply_to_id']:
        await process_message(msg['sender_id'], msg['message_text'], msg['message_id'], msg['reply_to_id'])
    else:
        await process_message(msg['sender_id'], msg['message_text'], msg['message_id'])     
def report_status():
    global CONSUMER_NAME
    while True:
        try:
            obj = REDIS_CONN.get("TASKEXE")
            if not obj: obj = {}
            else: obj = json.loads(obj)
            if CONSUMER_NAME not in obj: obj[CONSUMER_NAME] = []
            obj[CONSUMER_NAME].append(timer())
            obj[CONSUMER_NAME] = obj[CONSUMER_NAME][-60:]
            REDIS_CONN.set_obj("TASKEXE", obj, 60*2)
        except Exception as e:
            print("[Exception]:", str(e))
        time.sleep(30)


async def main():
    """
        In here, it will handle background tasks
    """
    await collect()



if __name__ == "__main__":

    exe = ThreadPoolExecutor(max_workers=2)
    exe.submit(report_status)

    while True:
        asyncio.run(main())
        if PAYLOAD:
            PAYLOAD.ack()
            PAYLOAD = None