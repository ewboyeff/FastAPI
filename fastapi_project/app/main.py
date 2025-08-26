from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List
from datetime import datetime, timedelta

from .database import Base, engine, get_db, User, Order, Payment, UserRole, OrderStatus, PaymentStatus
from .utils import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    get_current_user,
    get_current_active_admin,
    get_current_active_worker
)
from .ws import manager, notify_new_order, notify_order_status
from .payment_gateway import payment_gateway, PaymentResult

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Service Platform API")

@app.post("/register")
async def register(
    username: str,
    email: str,
    password: str,
    role: UserRole,
    worker_speciality: str = None,
    db: Session = Depends(get_db)
):
    """Yangi foydalanuvchi ro'yxatdan o'tishi"""
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        username=username,
        email=email,
        password_hash=get_password_hash(password),
        role=role,
        worker_speciality=worker_speciality if role == UserRole.WORKER else None
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {"message": "User created successfully"}

@app.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Tizimga kirish va token olish"""
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=30)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id
    }

# --- USER ENDPOINTS ---
@app.get("/users/me", response_model=dict)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Joriy foydalanuvchi ma'lumotlarini olish"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "worker_speciality": current_user.worker_speciality
    }

@app.get("/users", response_model=List[dict])
async def get_all_users(
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Barcha foydalanuvchilar ro'yxatini olish (faqat admin uchun)"""
    users = db.query(User).all()
    return [{"id": user.id, "username": user.username, "email": user.email, 
             "role": user.role, "worker_speciality": user.worker_speciality} 
            for user in users]

# --- ORDER ENDPOINTS ---
@app.post("/orders", response_model=dict)
async def create_order(
    service_type: str,
    description: str,
    price: float,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Yangi buyurtma yaratish"""
    if current_user.role != UserRole.CLIENT:
        raise HTTPException(status_code=400, detail="Only clients can create orders")
    
    order = Order(
        client_id=current_user.id,
        service_type=service_type,
        description=description,
        price=price,
        status=OrderStatus.NEW
    )
    
    db.add(order)
    db.commit()
    db.refresh(order)
    
    # WebSocket orqali xabar yuborish
    await notify_new_order(order.id, db)
    
    return {
        "id": order.id,
        "service_type": order.service_type,
        "description": order.description,
        "price": order.price,
        "status": order.status,
        "created_at": order.created_at
    }

@app.get("/orders", response_model=List[dict])
async def get_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Buyurtmalarni ko'rish (rol bo'yicha)"""
    if current_user.role == UserRole.ADMIN:
        orders = db.query(Order).all()
    elif current_user.role == UserRole.WORKER:
        orders = db.query(Order).filter(Order.service_type == current_user.worker_speciality).all()
    else:
        orders = db.query(Order).filter(Order.client_id == current_user.id).all()
    
    return [{
        "id": order.id,
        "service_type": order.service_type,
        "description": order.description,
        "price": order.price,
        "status": order.status,
        "created_at": order.created_at,
        "client": {"id": order.client.id, "username": order.client.username},
        "worker": {"id": order.worker.id, "username": order.worker.username} if order.worker else None
    } for order in orders]

@app.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: int,
    status: OrderStatus,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Buyurtma statusini yangilash"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Statusni yangilash huquqini tekshirish
    if current_user.role == UserRole.CLIENT and order.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this order")
    if current_user.role == UserRole.WORKER and order.worker_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this order")
    
    order.status = status
    db.commit()
    db.refresh(order)
    
    # WebSocket orqali xabar yuborish
    await notify_order_status(order, db)
    
    return order

# --- PAYMENT ENDPOINTS ---
@app.post("/payments/{order_id}")
async def create_payment(
    order_id: int,
    card_number: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """To'lov yaratish va process qilish"""
    # Buyurtmani tekshirish
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Faqat buyurtma egasi to'lov qila oladi
    if order.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to pay for this order")
    
    # Buyurtma statusini tekshirish
    if order.status == OrderStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Order is already completed")
    if order.status == OrderStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Cannot pay for cancelled order")
    
    # To'lovni process qilish
    payment_result = payment_gateway.process_payment(order.price, card_number)
    
    # To'lov yaratish
    payment = Payment(
        order_id=order_id,
        amount=order.price,
        status=PaymentStatus.PAID if payment_result["status"] == PaymentResult.SUCCESS else PaymentStatus.CANCELLED,
        payment_date=datetime.utcnow() if payment_result["status"] == PaymentResult.SUCCESS else None
    )
    
    db.add(payment)
    
    # Agar to'lov muvaffaqiyatli bo'lsa
    if payment_result["status"] == PaymentResult.SUCCESS:
        order.status = OrderStatus.IN_PROGRESS
        await notify_order_status(order, db)
    
    try:
        db.commit()
        db.refresh(payment)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Payment processing failed")
    
    return {
        "payment": {
            "id": payment.id,
            "amount": payment.amount,
            "status": payment.status,
            "created_at": payment.created_at,
            "payment_date": payment.payment_date
        },
        "transaction_details": payment_result,
        "order_status": order.status
    }

@app.get("/payments/history")
async def get_payment_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """To'lovlar tarixini olish"""
    if current_user.role == UserRole.ADMIN:
        payments = db.query(Payment).all()
    else:
        orders = db.query(Order).filter(Order.client_id == current_user.id).all()
        order_ids = [order.id for order in orders]
        payments = db.query(Payment).filter(Payment.order_id.in_(order_ids)).all()
    
    return [{
        "id": payment.id,
        "order_id": payment.order_id,
        "amount": payment.amount,
        "status": payment.status,
        "created_at": payment.created_at
    } for payment in payments]

# --- WEBSOCKET ENDPOINT ---
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(get_db)):
    """WebSocket ulanish"""
    await manager.connect(websocket, user_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)