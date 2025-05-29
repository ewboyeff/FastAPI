from sqlalchemy.orm import Session, joinedload
from models import Ingredient, Meal, MealIngredient, MealServe, User, Log
from schemas import IngredientCreate, IngredientUpdate, MealCreate, MealUpdate, MealServeCreate, UserCreate
from fastapi import HTTPException
from sqlalchemy import func
from datetime import datetime
import math
from auth import get_password_hash

# Ingredient CRUD
def create_ingredient(db: Session, ingredient: IngredientCreate):
    db_ingredient = Ingredient(
        name=ingredient.name,
        quantity=ingredient.quantity,
        delivery_date=ingredient.delivery_date,
        minimum_quantity=ingredient.minimum_quantity
    )
    db.add(db_ingredient)
    db.commit()
    db.refresh(db_ingredient)
    return db_ingredient

def get_ingredients(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Ingredient).offset(skip).limit(limit).all()

def get_ingredient(db: Session, ingredient_id: int):
    return db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()

def update_ingredient(db: Session, ingredient_id: int, ingredient: IngredientUpdate):
    db_ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
    if db_ingredient:
        db_ingredient.name = ingredient.name
        db_ingredient.quantity = ingredient.quantity
        db_ingredient.delivery_date = ingredient.delivery_date
        db_ingredient.minimum_quantity = ingredient.minimum_quantity
        db.commit()
        db.refresh(db_ingredient)
    return db_ingredient

def delete_ingredient(db: Session, ingredient_id: int):
    db_ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
    if db_ingredient:
        db.delete(db_ingredient)
        db.commit()
    return db_ingredient

# Meal CRUD
def create_meal(db: Session, meal: MealCreate):
    db_meal = Meal(name=meal.name)
    db.add(db_meal)
    db.commit()
    db.refresh(db_meal)

    for ingredient in meal.ingredients:
        db_ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient.ingredient_id).first()
        if not db_ingredient:
            raise HTTPException(status_code=404, detail=f"Ingredient ID {ingredient.ingredient_id} not found")
        db_meal_ingredient = MealIngredient(
            meal_id=db_meal.id,
            ingredient_id=ingredient.ingredient_id,
            quantity=ingredient.quantity
        )
        db.add(db_meal_ingredient)
    db.commit()
    db.refresh(db_meal)
    return db_meal

def get_meals(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Meal).options(joinedload(Meal.ingredients)).offset(skip).limit(limit).all()

def get_meal(db: Session, meal_id: int):
    return db.query(Meal).options(joinedload(Meal.ingredients)).filter(Meal.id == meal_id).first()

def update_meal(db: Session, meal_id: int, meal: MealUpdate):
    db_meal = db.query(Meal).filter(Meal.id == meal_id).first()
    if not db_meal:
        return None
    db_meal.name = meal.name
    db.query(MealIngredient).filter(MealIngredient.meal_id == meal_id).delete()
    for ingredient in meal.ingredients:
        db_ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient.ingredient_id).first()
        if not db_ingredient:
            raise HTTPException(status_code=404, detail=f"Ingredient ID {ingredient.ingredient_id} not found")
        db_meal_ingredient = MealIngredient(
            meal_id=db_meal.id,
            ingredient_id=ingredient.ingredient_id,
            quantity=ingredient.quantity
        )
        db.add(db_meal_ingredient)
    db.commit()
    db.refresh(db_meal)
    return db_meal

def delete_meal(db: Session, meal_id: int):
    db_meal = db.query(Meal).filter(Meal.id == meal_id).first()
    if db_meal:
        db.query(MealIngredient).filter(MealIngredient.meal_id == meal_id).delete()
        db.delete(db_meal)
        db.commit()
    return db_meal

def delete_meal_ingredients_by_meal(db: Session, meal_id: int):
    db.query(MealIngredient).filter(MealIngredient.meal_id == meal_id).delete()
    db.commit()

def get_meal_ingredients_by_meal(db: Session, meal_id: int):
    return db.query(MealIngredient).filter(MealIngredient.meal_id == meal_id).all()

# User CRUD
def create_user(db: Session, user: UserCreate):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user.password)
    db_user = User(username=user.username, hashed_password=hashed_password, role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()

# MealServe funksiyalari
def serve_meal(db: Session, meal_serve: MealServeCreate, user_id: int):
    db_meal = db.query(Meal).filter(Meal.id == meal_serve.meal_id).first()
    if not db_meal:
        raise HTTPException(status_code=404, detail="Meal not found")

    for meal_ingredient in db_meal.ingredients:
        db_ingredient = db.query(Ingredient).filter(Ingredient.id == meal_ingredient.ingredient_id).first()
        if not db_ingredient:
            raise HTTPException(status_code=404, detail=f"Ingredient ID {meal_ingredient.ingredient_id} not found")
        required_quantity = meal_ingredient.quantity * meal_serve.portions
        if db_ingredient.quantity < required_quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Not enough {db_ingredient.name}. Required: {required_quantity}g, Available: {db_ingredient.quantity}g"
            )
        db_ingredient.quantity -= required_quantity

    db_meal_serve = MealServe(
        meal_id=meal_serve.meal_id,
        user_id=user_id,
        served_at=datetime.utcnow(),
        portions=meal_serve.portions
    )
    db.add(db_meal_serve)
    db.commit()
    db.refresh(db_meal_serve)
    return db_meal_serve

def get_meal_serves(db: Session, skip: int = 0, limit: int = 100):
    return db.query(MealServe).offset(skip).limit(limit).all()

def get_meal_serves_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(MealServe).filter(MealServe.user_id == user_id).offset(skip).limit(limit).all()

# Portions hisoblash
def calculate_portions(db: Session, meal_id: int):
    db_meal = db.query(Meal).options(joinedload(Meal.ingredients)).filter(Meal.id == meal_id).first()
    if not db_meal:
        raise HTTPException(status_code=404, detail="Meal not found")

    if not db_meal.ingredients:
        return 0

    portions = float('inf')
    for meal_ingredient in db_meal.ingredients:
        db_ingredient = db.query(Ingredient).filter(Ingredient.id == meal_ingredient.ingredient_id).first()
        if not db_ingredient:
            raise HTTPException(status_code=404, detail=f"Ingredient ID {meal_ingredient.ingredient_id} not found")
        if meal_ingredient.quantity == 0:
            continue
        
        # Convert both values to float before division
        ingredient_quantity = float(db_ingredient.quantity)
        recipe_quantity = float(meal_ingredient.quantity)
        
        # Now perform the division with converted values
        available_portions = ingredient_quantity / recipe_quantity
        portions = min(portions, available_portions)
    
    return math.floor(portions)

def get_all_portions(db: Session, skip: int = 0, limit: int = 100):
    try:
        result = db.query(
            Meal.id.label('meal_id'),
            Meal.name.label('meal_name'),
            func.coalesce(func.sum(MealServe.portions), 0).label('portions')
        ).join(MealServe, Meal.id == MealServe.meal_id, isouter=True
        ).group_by(Meal.id, Meal.name
        ).offset(skip).limit(limit).all()
        
        portions = [
            {
                "meal_id": row.meal_id,
                "meal_name": row.meal_name,
                "portions": row.portions
            }
            for row in result
        ]
        return portions
    except Exception as e:
        raise Exception(f"Error fetching portions: {str(e)}")

# Report funksiyalari
def get_monthly_report(db: Session, year: int, month: int):
    """
    Generate monthly report for specified year and month
    
    Args:
        db (Session): Database session
        year (int): Year to generate report for
        month (int): Month to generate report for
    """
    total_served = db.query(func.count(MealServe.id)).filter(
        func.extract('year', MealServe.served_at) == year,
        func.extract('month', MealServe.served_at) == month
    ).scalar() or 0

    # Rest of the function remains the same
    total_possible = 0
    meals = db.query(Meal).options(joinedload(Meal.ingredients)).all()
    for meal in meals:
        portions = calculate_portions(db, meal.id)
        total_possible += portions

    if total_possible == 0:
        difference_percentage = 0.0
    else:
        difference_percentage = ((total_served - total_possible) / total_possible) * 100

    warning = None
    if abs(difference_percentage) > 15:
        warning = "Warning: Potential misuse detected (difference > 15%)"
    elif abs(difference_percentage) > 10:
        warning = "Caution: Difference exceeds 10%"

    return {
        "year": year,
        "month": month,
        "total_served": total_served,
        "total_possible": total_possible,
        "difference_percentage": round(difference_percentage, 2),
        "warning": warning
    }

def get_ingredient_usage(db: Session):
    usage = db.query(
        Ingredient.id,
        Ingredient.name,
        Ingredient.delivery_date,
        func.sum(MealIngredient.quantity * MealServe.portions).label('total_used')
    ).join(MealIngredient, Ingredient.id == MealIngredient.ingredient_id
    ).join(Meal, MealIngredient.meal_id == Meal.id
    ).join(MealServe, MealServe.meal_id == Meal.id, isouter=True
    ).group_by(Ingredient.id, Ingredient.name, Ingredient.delivery_date).all()

    result = [
        {
            "ingredient_id": row.id,
            "ingredient_name": row.name,
            "total_used": float(row.total_used) if row.total_used else 0.0,
            "delivery_date": row.delivery_date
        }
        for row in usage
    ]
    return result

# Log-related CRUD
def create_log(db: Session, action: str, user_id: int, details: str = None):
    db_log = Log(action=action, user_id=user_id, details=details, timestamp=datetime.utcnow())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log
def get_meal_serves_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(MealServe).options(joinedload(MealServe.meal)).filter(MealServe.user_id == user_id).offset(skip).limit(limit).all()