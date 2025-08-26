from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import enum
from os import getenv
from dotenv import load_dotenv

# .env faylini o'qish
load_dotenv()

# SQLite URL (PostgreSQL o'rniga)
DATABASE_URL = "sqlite:///./sql_app.db"

# Database engine yaratish
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}  # SQLite uchun zarur
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Role enum
class UserRole(str, enum.Enum):
    CLIENT = "client"
    WORKER = "ishchi"
    ADMIN = "admin"

# Order status enum
class OrderStatus(str, enum.Enum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# Payment status enum
class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    CANCELLED = "cancelled"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default=UserRole.CLIENT)
    worker_speciality = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    orders = relationship("Order", back_populates="client", foreign_keys="Order.client_id")
    worker_orders = relationship("Order", back_populates="worker", foreign_keys="Order.worker_id")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"))
    worker_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    service_type = Column(String)
    description = Column(String)
    price = Column(Float)
    status = Column(String, default=OrderStatus.NEW)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    client = relationship("User", back_populates="orders", foreign_keys=[client_id])
    worker = relationship("User", back_populates="worker_orders", foreign_keys=[worker_id])
    payment = relationship("Payment", back_populates="order", uselist=False)

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))  # UNIQUE ni olib tashlaymiz
    amount = Column(Float)
    status = Column(String, default=PaymentStatus.PENDING)
    payment_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    order = relationship("Order", back_populates="payment")
# Database sessiyasini olish uchun dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Database jadvallarini yaratish
Base.metadata.create_all(bind=engine)