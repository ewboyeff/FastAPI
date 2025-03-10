from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, DECIMAL
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    is_staff = Column(Boolean, default=False)  # Admin yoki oddiy user

    bids = relationship("Bid", back_populates="user")

class AutoPlate(Base):
    __tablename__ = "plates"

    id = Column(Integer, primary_key=True, index=True)
    plate_number = Column(String(10), unique=True, index=True)
    description = Column(String)
    deadline = Column(DateTime)
    created_by = Column(Integer, ForeignKey("users.id"))
    is_active = Column(Boolean, default=True)

    bids = relationship("Bid", back_populates="plate")

class Bid(Base):
    __tablename__ = "bids"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(DECIMAL(10, 2))
    user_id = Column(Integer, ForeignKey("users.id"))
    plate_id = Column(Integer, ForeignKey("plates.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="bids")
    plate = relationship("AutoPlate", back_populates="bids")
