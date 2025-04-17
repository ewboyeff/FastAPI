from fastapi import FastAPI, Depends, HTTPException, status, Form, File, UploadFile
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base, get_db
from models import User, SurpriseBag, Order, OrderItem, UserResponse, UserCreate, UserUpdate, SurpriseBagResponse, SurpriseBagCreate, SurpriseBagUpdate, OrderResponse, OrderItemResponse, OrderCreate, Token
from pydantic import BaseModel, validator
from passlib.context import CryptContext
from auth import create_access_token, get_current_user, get_current_store, get_current_customer
from datetime import timedelta, datetime
from typing import Optional, List
import os
import uuid
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Static fayllar uchun direktoriya
UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# CORS sozlamalari
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ma’lumotlar bazasini yaratish
Base.metadata.create_all(bind=engine)

# Parolni shifrlash uchun Passlib konteksti
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Foydalanuvchi ro‘yxatdan o‘tish
@app.post("/register/", status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user_email = db.query(User).filter(User.email == user.email).first()
    db_user_phone = db.query(User).filter(User.phone == user.phone).first()
    if db_user_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    if db_user_phone:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    if user.role not in ["store", "customer"]:
        raise HTTPException(status_code=400, detail="Role must be 'store' or 'customer'")
    if user.balance < 0:
        raise HTTPException(status_code=400, detail="Balance cannot be negative")
    
    hashed_password = pwd_context.hash(user.password)
    new_user = User(
        name=user.name,
        email=user.email,
        phone=user.phone,
        hashed_password=hashed_password,
        role=user.role,
        balance=user.balance,
        created_at=datetime.utcnow()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "User registered successfully", "user_id": new_user.id}

# Login endpointi
@app.post("/login/", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# “Surprise Bag” qo‘shish
@app.post("/surprise-bags/", response_model=SurpriseBagResponse)
async def create_surprise_bag(
    title: str = Form(...),
    description: str = Form(...),
    contents: str = Form(...),
    original_price: float = Form(...),
    discount_price: float = Form(...),
    quantity: int = Form(...),
    is_active: bool = Form(True),
    image: UploadFile = File(None),
    current_user: User = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    # Validatsiya
    if original_price <= 0:
        raise HTTPException(status_code=400, detail="Original price must be positive")
    if discount_price <= 0:
        raise HTTPException(status_code=400, detail="Discount price must be positive")
    if original_price <= discount_price:
        raise HTTPException(status_code=400, detail="Original price must be greater than discount price")
    if quantity < 0:
        raise HTTPException(status_code=400, detail="Quantity cannot be negative")

    # Rasmni saqlash (agar yuborilgan bo‘lsa)
    image_url = None
    if image:
        file_extension = image.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as f:
            content = await image.read()
            f.write(content)
        
        image_url = f"/{file_path}"

    # SurpriseBag yaratish
    db_bag = SurpriseBag(
        title=title,
        description=description,
        contents=contents,
        original_price=original_price,
        discount_price=discount_price,
        quantity=quantity,
        is_active=is_active,
        store_id=current_user.id,
        status="available" if quantity > 0 and is_active else "sold",
        image_url=image_url,
        created_at=datetime.utcnow()
    )
    db.add(db_bag)
    db.commit()
    db.refresh(db_bag)

    print(f"Notification: Surprise Bag {db_bag.id} created by store {current_user.id}.")
    
    return db_bag

# “Surprise Bag”ni yangilash
@app.put("/surprise-bags/{bag_id}/", response_model=SurpriseBagResponse)
async def update_surprise_bag(
    bag_id: int,
    title: str = Form(None),
    description: str = Form(None),
    contents: str = Form(None),
    original_price: float = Form(None),
    discount_price: float = Form(None),
    quantity: int = Form(None),
    is_active: bool = Form(None),
    image: UploadFile = File(None),
    current_user: User = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    # SurpriseBag ni topish
    db_bag = db.query(SurpriseBag).filter(
        SurpriseBag.id == bag_id,
        SurpriseBag.store_id == current_user.id
    ).first()
    if not db_bag:
        raise HTTPException(status_code=404, detail="Surprise Bag not found or not yours")

    # Agar hech qanday yangilanish bo‘lmasa
    if not any([title, description, contents, original_price is not None, 
                discount_price is not None, quantity is not None, 
                is_active is not None, image is not None]):
        raise HTTPException(status_code=400, detail="At least one field must be provided to update")

    # Yangilanishlarni amalga oshirish
    if title:
        db_bag.title = title
    if description:
        db_bag.description = description
    if contents:
        db_bag.contents = contents
    if original_price is not None:
        if original_price <= 0:
            raise HTTPException(status_code=400, detail="Original price must be positive")
        db_bag.original_price = original_price
    if discount_price is not None:
        if discount_price <= 0:
            raise HTTPException(status_code=400, detail="Discount price must be positive")
        db_bag.discount_price = discount_price
    if quantity is not None:
        if quantity < 0:
            raise HTTPException(status_code=400, detail="Quantity cannot be negative")
        db_bag.quantity = quantity
    if is_active is not None:
        db_bag.is_active = is_active

    # Rasmni yangilash (agar yuborilgan bo‘lsa)
    if image:
        # Eski rasmni o‘chirish (agar mavjud bo‘lsa)
        if db_bag.image_url:
            old_file_path = db_bag.image_url.lstrip("/")
            if os.path.exists(old_file_path):
                os.remove(old_file_path)

        # Yangi rasmni saqlash
        file_extension = image.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as f:
            content = await image.read()
            f.write(content)
        
        db_bag.image_url = f"/{file_path}"

    # Original price va discount price o‘zaro mosligini tekshirish
    if (original_price is not None or discount_price is not None):
        original_price_val = original_price if original_price is not None else db_bag.original_price
        discount_price_val = discount_price if discount_price is not None else db_bag.discount_price
        if discount_price_val >= original_price_val:
            raise HTTPException(status_code=400, detail="Original price must be greater than discount price")

    # Statusni yangilash
    db_bag.status = "available" if db_bag.quantity > 0 and db_bag.is_active else "sold"

    db.commit()
    db.refresh(db_bag)

    print(f"Notification: Surprise Bag {db_bag.id} updated by store {current_user.id}.")
    
    return db_bag

# “Surprise Bag”ni o‘chirish
@app.delete("/surprise-bags/{bag_id}/")
def delete_surprise_bag(
    bag_id: int, 
    current_user: User = Depends(get_current_store), 
    db: Session = Depends(get_db)
):
    db_bag = db.query(SurpriseBag).filter(SurpriseBag.id == bag_id, SurpriseBag.store_id == current_user.id).first()
    if not db_bag:
        raise HTTPException(status_code=404, detail="Surprise Bag not found or not yours")
    
    # Agar rasm mavjud bo‘lsa, uni o‘chirish
    if db_bag.image_url:
        file_path = db_bag.image_url.lstrip("/")
        if os.path.exists(file_path):
            os.remove(file_path)
    
    db.delete(db_bag)
    db.commit()
    
    print(f"Notification: Surprise Bag {bag_id} deleted by store {current_user.id}.")
    
    return {"message": "Surprise Bag deleted successfully"}

# “Surprise Bag” ro‘yxatini ko‘rish
@app.get("/surprise-bags/", response_model=List[SurpriseBagResponse])
def get_surprise_bags(
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    store_name: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(SurpriseBag).join(User, SurpriseBag.store_id == User.id).filter(
        SurpriseBag.status == "available",
        SurpriseBag.is_active == True
    )

    # Narx bo‘yicha filtrlash
    if price_min is not None:
        query = query.filter(SurpriseBag.discount_price >= price_min)
    if price_max is not None:
        query = query.filter(SurpriseBag.discount_price <= price_max)

    # Do‘kon nomi bo‘yicha filtrlash
    if store_name:
        query = query.filter(User.name.ilike(f"%{store_name}%"))

    # Kalit so‘z bo‘yicha qidirish
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                SurpriseBag.title.ilike(search_term),
                SurpriseBag.description.ilike(search_term),
                SurpriseBag.contents.ilike(search_term)
            )
        )

    bags = query.all()

    # Har bir SurpriseBag uchun store_name ni qo‘shish
    for bag in bags:
        bag.store_name = db.query(User).filter(User.id == bag.store_id).first().name

    return bags

# Buyurtma qo‘shish
@app.post("/orders/", response_model=OrderResponse)
def create_order(
    order: OrderCreate,
    current_user: User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    print(f"Received order data: {order}")
    # Quantity ni tekshirish
    if order.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be positive")

    # SurpriseBag ni topish
    db_bag = db.query(SurpriseBag).filter(
        SurpriseBag.id == order.surprise_bag_id,
        SurpriseBag.status == "available",
        SurpriseBag.is_active == True,
        SurpriseBag.quantity >= order.quantity
    ).first()
    if not db_bag:
        raise HTTPException(status_code=404, detail="Surprise Bag not found, not active, or insufficient quantity")

    # Total price ni hisoblash (miqdor bo‘yicha)
    total_price = db_bag.discount_price * order.quantity

    # Mijozning balansini tekshirish
    if current_user.balance < total_price:
        raise HTTPException(status_code=400, detail="Insufficient balance to place this order")

    # Mavjud "pending" yoki "confirmed" buyurtmani topish
    existing_order = db.query(Order).filter(
        Order.customer_id == current_user.id,
        Order.status.in_(["pending", "confirmed"])
    ).first()

    if not existing_order:
        new_order = Order(
            customer_id=current_user.id,
            status="pending",
            total_price=0.0,
            created_at=datetime.utcnow()
        )
        db.add(new_order)
        db.commit()
        db.refresh(new_order)
        existing_order = new_order

    # SurpriseBag miqdorini kamaytirish
    db_bag.quantity -= order.quantity
    # OrderItem yaratish (quantity bilan)
    new_order_item = OrderItem(
        order_id=existing_order.id,
        surprise_bag_id=order.surprise_bag_id,
        quantity=order.quantity,
        created_at=datetime.utcnow()
    )
    db.add(new_order_item)
    db.commit()
    db.refresh(new_order_item)
    db.refresh(db_bag)

    # Total price ni yangilash (barcha OrderItem lar bo‘yicha)
    order_items = db.query(OrderItem).filter(OrderItem.order_id == existing_order.id).all()
    total_price = 0.0
    for item in order_items:
        surprise_bag = db.query(SurpriseBag).filter(SurpriseBag.id == item.surprise_bag_id).first()
        if surprise_bag:
            total_price += surprise_bag.discount_price * item.quantity
        item.surprise_bag = surprise_bag
    existing_order.total_price = total_price

    # Mijozning balansidan pul ayirish
    current_user.balance -= total_price
    db.commit()
    db.refresh(current_user)
    db.refresh(existing_order)

    existing_order.items = order_items
    
    print(f"Notification: Order {existing_order.id} updated with Surprise Bag {order.surprise_bag_id}, quantity: {order.quantity}. Customer balance: {current_user.balance}")
    
    return existing_order

# Mijozning buyurtmalarini ko‘rish
@app.get("/orders/", response_model=List[OrderResponse])
def get_orders(
    current_user: User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    orders = db.query(Order).filter(Order.customer_id == current_user.id).all()
    for order in orders:
        order_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
        for item in order_items:
            surprise_bag = db.query(SurpriseBag).filter(SurpriseBag.id == item.surprise_bag_id).first()
            if surprise_bag:
                # store_name ni qo‘shish
                surprise_bag.store_name = db.query(User).filter(User.id == surprise_bag.store_id).first().name
            item.surprise_bag = surprise_bag
        order.items = order_items
    return orders
@app.get("/store/surprise-bags/", response_model=List[SurpriseBagResponse])
def get_store_surprise_bags(
    search: Optional[str] = None,
    sort: Optional[str] = "newest",
    current_user: User = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    query = db.query(SurpriseBag).filter(SurpriseBag.store_id == current_user.id)

    # Search by title
    if search:
        query = query.filter(SurpriseBag.title.ilike(f"%{search}%"))

    # Sorting
    if sort == "newest":
        query = query.order_by(SurpriseBag.created_at.desc())
    elif sort == "oldest":
        query = query.order_by(SurpriseBag.created_at.asc())
    elif sort == "price_low_to_high":
        query = query.order_by(SurpriseBag.discount_price.asc())
    elif sort == "price_high_to_low":
        query = query.order_by(SurpriseBag.discount_price.desc())

    bags = query.all()

    # Add store_name (though not needed for store owner, for consistency)
    for bag in bags:
        bag.store_name = current_user.name

    return bags
@app.get("/store/stats/")
def get_store_stats(current_user: User = Depends(get_current_store), db: Session = Depends(get_db)):
    total_bags = db.query(SurpriseBag).filter(SurpriseBag.store_id == current_user.id).count()
    active_bags = db.query(SurpriseBag).filter(SurpriseBag.store_id == current_user.id, SurpriseBag.status == "available").count()
    total_orders = db.query(Order).join(OrderItem).join(SurpriseBag).filter(SurpriseBag.store_id == current_user.id).count()
    return {
        "total_surprise_bags": total_bags,
        "active_surprise_bags": active_bags,
        "total_orders": total_orders
    }

# Buyurtmalarni tasdiqlash
@app.post("/orders/confirm/{order_id}/", response_model=OrderResponse)
def confirm_order(
    order_id: int,
    current_user: User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.customer_id == current_user.id,
        Order.status == "pending"
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Pending order not found or not yours")
    
    order.status = "confirmed"
    db.commit()
    db.refresh(order)
    
    order_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    for item in order_items:
        surprise_bag = db.query(SurpriseBag).filter(SurpriseBag.id == item.surprise_bag_id).first()
        item.surprise_bag = surprise_bag
    order.items = order_items
    
    print(f"Notification: Order {order_id} confirmed for user {current_user.id}")
    
    return order

# Buyurtmani bekor qilish
@app.post("/orders/cancel/{order_id}/", response_model=OrderResponse)
def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.customer_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status == "completed":
        order_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
        if not order_items:
            raise HTTPException(status_code=400, detail="Order has no items")

        first_item = order_items[0]
        surprise_bag = db.query(SurpriseBag).filter(SurpriseBag.id == first_item.surprise_bag_id).first()
        if not surprise_bag:
            raise HTTPException(status_code=404, detail="Surprise Bag not found")

        shop_owner = db.query(User).filter(User.id == surprise_bag.store_id).first()
        if not shop_owner:
            raise HTTPException(status_code=404, detail="Shop owner not found")

        shop_owner.balance -= order.total_price
        db.commit()
        db.refresh(shop_owner)
    
    if order.status not in ["pending", "confirmed"]:
        raise HTTPException(status_code=400, detail="Order can only be cancelled in pending or confirmed status")
    
    order_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    for item in order_items:
        db_bag = db.query(SurpriseBag).filter(SurpriseBag.id == item.surprise_bag_id).first()
        if db_bag:
            db_bag.quantity += item.quantity
            db.commit()
            db.refresh(db_bag)
    
    order.status = "cancelled"
    current_user.balance += order.total_price
    db.commit()
    db.refresh(order)
    db.refresh(current_user)
    
    for item in order_items:
        item.surprise_bag = db.query(SurpriseBag).filter(SurpriseBag.id == item.surprise_bag_id).first()
    order.items = order_items
    
    print(f"Notification: Order {order_id} was cancelled by user {current_user.id}. Customer balance: {current_user.balance}")
    
    return order

# Buyurtmani bajarish (completed)
@app.post("/orders/complete/{order_id}/", response_model=OrderResponse)
def complete_order(
    order_id: int,
    current_user: User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.customer_id == current_user.id,
        Order.status == "confirmed"
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found or not in confirmed status")
    
    order_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    if not order_items:
        raise HTTPException(status_code=400, detail="Order has no items")

    first_item = order_items[0]
    surprise_bag = db.query(SurpriseBag).filter(SurpriseBag.id == first_item.surprise_bag_id).first()
    if not surprise_bag:
        raise HTTPException(status_code=404, detail="Surprise Bag not found")

    shop_owner = db.query(User).filter(User.id == surprise_bag.store_id).first()
    if not shop_owner:
        raise HTTPException(status_code=404, detail="Shop owner not found")

    order.status = "completed"
    shop_owner.balance += order.total_price
    db.commit()
    db.refresh(order)
    db.refresh(shop_owner)

    for item in order_items:
        item.surprise_bag = db.query(SurpriseBag).filter(SurpriseBag.id == item.surprise_bag_id).first()
    order.items = order_items
    
    print(f"Notification: Order {order_id} was completed by user {current_user.id}. Shop owner balance: {shop_owner.balance}")
    
    return order

# Buyurtmani qaytarish (refund)
@app.post("/orders/refund/{order_id}/", response_model=OrderResponse)
def refund_order(
    order_id: int,
    current_user: User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.customer_id == current_user.id,
        Order.status == "completed"
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Completed order not found or not yours")
    
    order_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    if not order_items:
        raise HTTPException(status_code=400, detail="Order has no items")

    first_item = order_items[0]
    surprise_bag = db.query(SurpriseBag).filter(SurpriseBag.id == first_item.surprise_bag_id).first()
    if not surprise_bag:
        raise HTTPException(status_code=404, detail="Surprise Bag not found")

    shop_owner = db.query(User).filter(User.id == surprise_bag.store_id).first()
    if not shop_owner:
        raise HTTPException(status_code=404, detail="Shop owner not found")

    shop_owner.balance -= order.total_price
    current_user.balance += order.total_price
    order.status = "cancelled"
    
    for item in order_items:
        db_bag = db.query(SurpriseBag).filter(SurpriseBag.id == item.surprise_bag_id).first()
        if db_bag:
            db_bag.quantity += item.quantity
            db.commit()
            db.refresh(db_bag)

    db.commit()
    db.refresh(order)
    db.refresh(shop_owner)
    db.refresh(current_user)

    for item in order_items:
        item.surprise_bag = db.query(SurpriseBag).filter(SurpriseBag.id == item.surprise_bag_id).first()
    order.items = order_items
    
    print(f"Notification: Order {order_id} was refunded for user {current_user.id}. Customer balance: {current_user.balance}, Shop owner balance: {shop_owner.balance}")
    
    return order

# Do‘kon egasining buyurtmalarini ko‘rish
@app.get("/store/orders/", response_model=List[OrderResponse])
def get_store_orders(
    current_user: User = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    store_bags = db.query(SurpriseBag).filter(SurpriseBag.store_id == current_user.id).all()
    if not store_bags:
        return []

    bag_ids = [bag.id for bag in store_bags]
    order_items = db.query(OrderItem).filter(OrderItem.surprise_bag_id.in_(bag_ids)).all()
    if not order_items:
        return []

    order_ids = list(set(item.order_id for item in order_items))
    orders = db.query(Order).filter(Order.id.in_(order_ids)).all()

    for order in orders:
        order.items = [
            item for item in order_items if item.order_id == order.id
        ]
        for item in order.items:
            item.surprise_bag = db.query(SurpriseBag).filter(SurpriseBag.id == item.surprise_bag_id).first()

    return orders

# Foydalanuvchi balansini ko‘rish
@app.get("/user/balance/")
def get_balance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return {"balance": current_user.balance}

# Balansni to‘ldirish
@app.post("/user/deposit/")
def deposit_balance(
    amount: float,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Deposit amount must be positive")
    
    current_user.balance += amount
    db.commit()
    db.refresh(current_user)
    
    print(f"Notification: User {current_user.id} deposited {amount}. New balance: {current_user.balance}")
    
    return {"message": "Balance deposited successfully", "new_balance": current_user.balance}

# Foydalanuvchi profilini yangilash
@app.put("/user/update/", response_model=UserResponse)
def update_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not any([user_update.name, user_update.email, user_update.phone, user_update.password]):
        raise HTTPException(status_code=400, detail="At least one field must be provided to update")

    if user_update.email and user_update.email != current_user.email:
        existing_email = db.query(User).filter(User.email == user_update.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")
    if user_update.phone and user_update.phone != current_user.phone:
        existing_phone = db.query(User).filter(User.phone == user_update.phone).first()
        if existing_phone:
            raise HTTPException(status_code=400, detail="Phone number already registered")

    if user_update.name:
        current_user.name = user_update.name
    if user_update.email:
        current_user.email = user_update.email
    if user_update.phone:
        current_user.phone = user_update.phone
    if user_update.password:
        current_user.hashed_password = pwd_context.hash(user_update.password)

    db.commit()
    db.refresh(current_user)

    print(f"Notification: User {current_user.id} updated their profile.")
    
    return current_user

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Hello World from SurplusSaver!"}

# Health-check endpoint
@app.get("/health-check")
def health_check():
    return {"status": "healthy"}
