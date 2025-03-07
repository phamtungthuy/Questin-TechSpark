from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
from db.db_services.message_service import MessageQAService, MessageService
import json

router = APIRouter(tags=['WS_chat'])

conversation_map: Dict[str, List[WebSocket]] = {}

@router.websocket("/")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Message text was: {data}")
    except WebSocketDisconnect:
        pass
    
class ConnectionManager:
    async def connect(self, websocket: WebSocket, conversation_id: str):
        await websocket.accept()
        if conversation_id not in conversation_map:
            conversation_map[conversation_id] = []
        conversation_map[conversation_id].append(websocket)
        print(f"User joined conversation {conversation_id}")

    def disconnect(self, websocket: WebSocket, conversation_id: str):
        if conversation_id in conversation_map:
            conversation_map[conversation_id].remove(websocket)
            if not conversation_map[conversation_id]:  # Nếu nhóm trống thì xóa
                del conversation_map[conversation_id]
        print(f"User left conversation {conversation_id}")

    async def send_to_conversation(self, conversation_id: str, message: str):
        data = json.loads(message)
        # MessageService.insert(
        #     {
        #         "conversation_id" : data['conversationId']
        #         "dialog_id" : data['dialogId ']
        #     }
        # )
        if conversation_id in conversation_map:
            for connection in conversation_map[conversation_id]:
                await connection.send_text(message)

manager = ConnectionManager()

@router.websocket("/{conversation_id}")
async def websocket_endpoint(websocket: WebSocket, conversation_id: str):
    await manager.connect(websocket, conversation_id)
    
    try:
        while True:
            message = await websocket.receive_text()
            print(f"Received from {conversation_id}: {message}")
            await manager.send_to_conversation(conversation_id, message)
    except WebSocketDisconnect:
        manager.disconnect(websocket, conversation_id)
        
@router.get("/conversations", summary="Get active conversation IDs")
async def get_conversations():
    return {"conversations": list(conversation_map.keys())}

@router.get("/conversation/{conversation_id}")
async def get_conversations(conversation_id: str):
    messages = MessageService.get_list(
        conversation_id=conversation_id,  
        page_number=1,             
        items_per_page=10,         
        orderby="create_time",      
        desc=True,                 
        id=None                  
    )
    
    return messages