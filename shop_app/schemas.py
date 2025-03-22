from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    is_admin: bool = False

class User(BaseModel):
    id: Optional[int] = None
    username: str
    email: str
    is_admin: bool
    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    name: str
    price: float
    stock: int

class Product(BaseModel):
    id: int
    name: str
    price: float
    stock: int
    class Config:
        from_attributes = True

class CartItem(BaseModel):
    product_id: int
    quantity: int

class Order(BaseModel):
    id: int
    user_id: int
    total_price: float
    status: str
    class Config:
        from_attributes = True