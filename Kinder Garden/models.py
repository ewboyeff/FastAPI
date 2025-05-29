from sqlalchemy import Column, Integer, String, Enum, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from schemas import Role
import bcrypt

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(Role), nullable=False)
    # Add this new relationship
    served_meals = relationship("MealServe", back_populates="user", cascade="all, delete-orphan")

    def verify_password(self, password: str) -> bool:
        return bcrypt.checkpw(password.encode('utf-8'), self.hashed_password.encode('utf-8'))

class Ingredient(Base):
    __tablename__ = "ingredients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    quantity = Column(Float, nullable=False, default=0.0)
    delivery_date = Column(DateTime, nullable=False)
    minimum_quantity = Column(Float, nullable=False)

class Meal(Base):
    __tablename__ = "meals"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    ingredients = relationship("MealIngredient", back_populates="meal", cascade="all, delete-orphan")
    serves = relationship("MealServe", back_populates="meal", cascade="all, delete-orphan") 

class MealIngredient(Base):
    __tablename__ = "meal_ingredients"
    id = Column(Integer, primary_key=True, index=True)
    meal_id = Column(Integer, ForeignKey("meals.id", ondelete="CASCADE"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"), nullable=False)
    quantity = Column(Float, nullable=False)  # yoki kerakli formatga moslashtiring
    meal = relationship("Meal", back_populates="ingredients")
    ingredient = relationship("Ingredient")

class MealServe(Base):
    __tablename__ = "meal_serves"
    id = Column(Integer, primary_key=True, index=True)
    meal_id = Column(Integer, ForeignKey("meals.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    portions = Column(Float, nullable=False)  # portions maydoni Float sifatida aniq belgilandi
    served_at = Column(DateTime, default=datetime.utcnow)
    meal = relationship("Meal", back_populates="serves")
    user = relationship("User", back_populates="served_meals")

class Log(Base):
    __tablename__ = "logs"
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    details = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)