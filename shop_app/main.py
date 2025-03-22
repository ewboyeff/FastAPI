from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import Base, engine, get_db
from schemas import UserCreate, Product, CartItem, Order, ProductCreate, User  # Pydantic User
from auth import create_user, authenticate_user, create_access_token, get_current_user, get_current_admin
from crud import get_products, add_to_cart, create_order, create_product, update_product, delete_product
from websocket import manager
from fastapi import WebSocket
from fastapi.security import OAuth2PasswordRequestForm
from models import Cart  # SQLAlchemy Cart modeli

app = FastAPI()
Base.metadata.create_all(bind=engine)

# Ro'yxatdan o'tish
@app.post("/register", response_model=User)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = create_user(db, user)
    return db_user

# Kirish va token olish
@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

# Mahsulotlarni ko'rish
@app.get("/products", response_model=List[Product])
def read_products(min_price: float = None, max_price: float = None, db: Session = Depends(get_db)):
    return get_products(db, min_price, max_price)

# Mahsulot qo'shish (faqat admin uchun)
@app.post("/products", response_model=Product)
def add_product(product: ProductCreate, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    return create_product(db, product)

# Mahsulotni yangilash (faqat admin uchun)
@app.put("/products/{product_id}", response_model=Product)
def update_product_endpoint(product_id: int, product: ProductCreate, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    updated_product = update_product(db, product_id, product)
    if not updated_product:
        raise HTTPException(status_code=404, detail="Product not found")
    return updated_product

# Mahsulotni o'chirish (faqat admin uchun)
@app.delete("/products/{product_id}")
def delete_product_endpoint(product_id: int, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    deleted_product = delete_product(db, product_id)
    if not deleted_product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"msg": "Product deleted"}

# Savatga qo'shish
@app.post("/cart")
def add_item_to_cart(cart_item: CartItem, user=Depends(get_current_user), db: Session = Depends(get_db)):
    return add_to_cart(db, user.id, cart_item)

# Buyurtma berish
@app.post("/order", response_model=Order)
async def place_order(user=Depends(get_current_user), db: Session = Depends(get_db)):
    cart_items = db.query(Cart).filter(Cart.user_id == user.id).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    total_price = 0
    for item in cart_items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with id {item.product_id} not found")
        total_price += item.quantity * product.price
    order = create_order(db, user.id, total_price)
    db.query(Cart).filter(Cart.user_id == user.id).delete()
    db.commit()
    await manager.send_message(f"Order {order.id} placed by user {user.id}")
    return order
# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except:
        manager.disconnect(websocket)