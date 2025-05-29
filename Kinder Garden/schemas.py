from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from typing import List, Optional, Any

# Role enum
class Role(str, Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    CHEF = "CHEF"

# User-related schemas
class UserCreate(BaseModel):
    username: str
    password: str
    role: Role

class User(BaseModel):
    id: int
    username: str
    role: Role

    class Config:
        from_attributes = True

# Ingredient-related schemas
class IngredientCreate(BaseModel):
    name: str
    quantity: float
    delivery_date: datetime
    minimum_quantity: float

class IngredientUpdate(BaseModel):
    name: str
    quantity: float
    delivery_date: datetime
    minimum_quantity: float

class Ingredient(BaseModel):
    id: int
    name: str
    quantity: float
    delivery_date: datetime
    minimum_quantity: float

    class Config:
        from_attributes = True

# Meal-related schemas
class MealIngredientCreate(BaseModel):
    ingredient_id: int
    quantity: float

class MealCreate(BaseModel):
    name: str
    ingredients: List[MealIngredientCreate]

class MealUpdate(BaseModel):
    name: str
    ingredients: List[MealIngredientCreate]

class MealIngredient(BaseModel):
    meal_id: int
    ingredient_id: int
    quantity: float

    class Config:
        from_attributes = True

class Meal(BaseModel):
    id: int
    name: str
    ingredients: List[MealIngredient]

    class Config:
        from_attributes = True

# MealServe-related schemas
class MealServeCreate(BaseModel):
    meal_id: int
    portions: float  # Explicitly define as float
    
    class Config:
        from_attributes = True

class MealServe(BaseModel):
    id: int
    meal_id: int
    meal_name: str
    user_id: int
    served_at: datetime
    portions: int

    class Config:
        from_attributes = True

# Portions schema
class MealPortions(BaseModel):
    meal_id: int
    meal_name: str
    portions: int

# Reports-related schemas
class MonthlyReport(BaseModel):
    year: int
    month: int
    total_served: int
    total_possible: int
    difference_percentage: float
    warning: Optional[str]

class IngredientUsage(BaseModel):
    ingredient_id: int
    ingredient_name: str
    total_used: float
    delivery_date: datetime

# Token schema
class Token(BaseModel):
    access_token: str
    token_type: str

# Task-related schema
class TaskResponse(BaseModel):
    task_id: str
    status: str
    result: Optional[Any] = None