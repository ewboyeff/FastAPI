from fastapi import WebSocket, WebSocketDisconnect, Depends
from typing import Dict
import json
from datetime import datetime
from .database import User, Order, get_db  # Relative import qo'shildi
from sqlalchemy.orm import Session

# WebSocket connections saqlovchi
class ConnectionManager:
    def __init__(self):
        # {user_id: websocket}
        self.active_connections: Dict[int, WebSocket] = {}
        
    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        
    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            
    async def send_personal_message(self, message: str, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)
            
    async def notify_workers(self, message: str, speciality: str, db: Session):
        # Mutaxassislik bo'yicha ishchilarni topish
        workers = db.query(User).filter(
            User.role == "ishchi",
            User.worker_speciality == speciality
        ).all()
        
        # Har bir ishchiga xabar yuborish
        for worker in workers:
            if worker.id in self.active_connections:
                await self.send_personal_message(message, worker.id)

manager = ConnectionManager()

async def notify_new_order(order_id: int, db: Session):
    """Yangi buyurtma haqida xabar berish"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if order:
        message = json.dumps({
            "type": "new_order",
            "order_id": order.id,
            "service_type": order.service_type,
            "created_at": order.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "description": order.description
        })
        
        # Tegishli ishchilarga xabar yuborish
        await manager.notify_workers(message, order.service_type, db)

async def notify_order_status(order: Order, db: Session):
    """Buyurtma statusi o'zgarishi haqida xabar berish"""
    message = json.dumps({
        "type": "order_status",
        "order_id": order.id,
        "status": order.status,
        "updated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    })
    
    # Clientga xabar yuborish
    await manager.send_personal_message(message, order.client_id)
    
    # Agar ishchi biriktirilgan bo'lsa, unga ham xabar yuborish
    if order.worker_id:
        await manager.send_personal_message(message, order.worker_id)