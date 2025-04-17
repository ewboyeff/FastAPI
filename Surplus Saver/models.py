from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime


# SQLAlchemy modellar
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    balance = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    surprise_bags = relationship("SurpriseBag", back_populates="store")
    orders = relationship("Order", back_populates="customer")

class SurpriseBag(Base):
    __tablename__ = "surprise_bags"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    contents = Column(String, nullable=False)
    original_price = Column(Float, nullable=False)
    discount_price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    store_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="available")
    created_at = Column(DateTime, default=datetime.utcnow)
    image_url = Column(String, nullable=True)

    store = relationship("User", back_populates="surprise_bags")
    order_items = relationship("OrderItem", back_populates="surprise_bag")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="pending")
    total_price = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    surprise_bag_id = Column(Integer, ForeignKey("surprise_bags.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="items")
    surprise_bag = relationship("SurpriseBag", back_populates="order_items")

# Pydantic modellar
class UserCreate(BaseModel):
    name: str
    email: str
    phone: str
    password: str
    role: str
    balance: float = 0.0

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    role: str
    balance: float
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None

class SurpriseBagCreate(BaseModel):
    title: str
    description: str
    contents: str
    original_price: float
    discount_price: float
    quantity: int
    is_active: bool = True

class SurpriseBagUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    contents: Optional[str] = None
    original_price: Optional[float] = None
    discount_price: Optional[float] = None
    quantity: Optional[int] = None
    is_active: Optional[bool] = None

class SurpriseBagResponse(BaseModel):
    id: int
    title: str
    description: str
    contents: str
    original_price: float
    discount_price: float
    quantity: int
    is_active: bool
    store_id: int
    store_name: Optional[str] = None
    status: str
    created_at: datetime
    image_url: Optional[str] = None

    class Config:
        from_attributes = True

class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    surprise_bag_id: int
    quantity: int
    surprise_bag: Optional[SurpriseBagResponse] = None
    created_at: datetime

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    status: str
    total_price: float
    created_at: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    surprise_bag_id: int
    quantity: int

    @validator("surprise_bag_id", pre=True)
    def parse_surprise_bag_id(cls, value):
        if isinstance(value, str):
            try:
                return int(value)
            except ValueError:
                raise ValueError("surprise_bag_id must be an integer")
        return value

class Token(BaseModel):
    access_token: str
    token_type: str