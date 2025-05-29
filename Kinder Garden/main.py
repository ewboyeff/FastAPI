from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import jwt
from fastapi.middleware.cors import CORSMiddleware
from database import SessionLocal, engine, Base
from crud import (
    get_user_by_username, create_user, get_meal, create_meal, get_meals,
    update_meal, delete_meal, get_ingredient, create_ingredient,
    update_ingredient, delete_ingredient, get_meal_ingredients_by_meal,
    delete_meal_ingredients_by_meal, get_all_portions, serve_meal,
    get_meal_serves_by_user, get_monthly_report, get_ingredient_usage,
    create_log
)
from models import MealServe as MealServeModel, User as UserModel, Meal as MealModel, Ingredient as IngredientModel, MealIngredient, Log
from sqlalchemy.orm import joinedload
from schemas import (
    User, UserCreate, Token, Meal, MealCreate, MealUpdate, Ingredient,
    IngredientCreate, IngredientUpdate, MealPortions, MealServe,
    MealServeCreate, MonthlyReport, IngredientUsage, Role, TaskResponse
)
from auth import oauth2_scheme, create_access_token, get_current_user, require_any_role, require_role
from celery.result import AsyncResult
from tasks import celery_app, generate_monthly_report, check_ingredients_quantity

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
Base.metadata.create_all(bind=engine)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Login endpoint
@app.post("/login/", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = get_user_by_username(db, form_data.username)
    if not user or not user.verify_password(form_data.password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

# Users endpoints
@app.post("/users/", response_model=User)
def create_new_user(user: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.ADMIN))):
    db_user = get_user_by_username(db, user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return create_user(db=db, user=user)

@app.get("/users/", response_model=List[User])
def read_users(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.ADMIN))
):
    users = db.query(UserModel).offset(skip).limit(limit).all()
    return users

@app.get("/users/me/", response_model=User)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

# Ingredients endpoints
@app.post("/ingredients/", response_model=Ingredient)
def create_new_ingredient(
    ingredient: IngredientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role([Role.ADMIN, Role.MANAGER]))
):
    db_ingredient = create_ingredient(db=db, ingredient=ingredient)
    create_log(
        db, 
        action="Ingrediyent yaratildi",
        user_id=current_user.id,
        details=f"Name: {ingredient.name}, Quantity: {ingredient.quantity}"
    )
    return db_ingredient

@app.get("/ingredients/", response_model=List[Ingredient])
def read_ingredients(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    ingredients = db.query(IngredientModel).offset(skip).limit(limit).all()
    return ingredients

@app.get("/ingredients/{ingredient_id}/", response_model=Ingredient)
def read_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    db_ingredient = get_ingredient(db, ingredient_id)
    if db_ingredient is None:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return db_ingredient

@app.put("/ingredients/{ingredient_id}/", response_model=Ingredient)
def update_existing_ingredient(
    ingredient_id: int,
    ingredient: IngredientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role([Role.ADMIN, Role.MANAGER]))
):
    db_ingredient = update_ingredient(db=db, ingredient_id=ingredient_id, ingredient=ingredient)
    create_log(
        db, 
        action="Ingrediyent yangilandi",
        user_id=current_user.id,
        details=f"ID: {ingredient_id}, New Name: {ingredient.name}, New Quantity: {ingredient.quantity}"
    )
    return db_ingredient

@app.delete("/ingredients/{ingredient_id}/", response_model=Ingredient)
def delete_existing_ingredient(
    ingredient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role([Role.ADMIN, Role.MANAGER]))
):
    db_ingredient = delete_ingredient(db=db, ingredient_id=ingredient_id)
    create_log(
        db, 
        action="Ingrediyent o'chirildi",
        user_id=current_user.id,
        details=f"ID: {ingredient_id}"
    )
    return db_ingredient

# Meals endpoints
@app.post("/meals/", response_model=Meal)
def create_new_meal(
    meal: MealCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role([Role.ADMIN, Role.MANAGER]))
):
    db_meal = create_meal(db=db, meal=meal)
    create_log(
        db, 
        action="Ovqat yaratildi",
        user_id=current_user.id,
        details=f"Name: {meal.name}"
    )
    return db_meal

@app.get("/meals/", response_model=List[Meal])
def read_meals(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    meals = get_meals(db, skip=skip, limit=limit)
    return meals

@app.get("/meals/{meal_id}/", response_model=Meal)
def read_meal(meal_id: int, db: Session = Depends(get_db)):
    db_meal = get_meal(db, meal_id)
    if db_meal is None:
        raise HTTPException(status_code=404, detail="Meal not found")
    return db_meal

@app.put("/meals/{meal_id}/", response_model=Meal)
def update_existing_meal(
    meal_id: int,
    meal_update: MealUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role([Role.ADMIN, Role.MANAGER]))
):
    db_meal = get_meal(db, meal_id)
    if not db_meal:
        raise HTTPException(status_code=404, detail="Meal not found")

    delete_meal_ingredients_by_meal(db, meal_id)
    db_meal.name = meal_update.name
    for ingredient in meal_update.ingredients:
        db_meal_ingredient = MealIngredient(
            meal_id=meal_id,
            ingredient_id=ingredient.ingredient_id,
            quantity=ingredient.quantity
        )
        db.add(db_meal_ingredient)
    db.commit()
    db.refresh(db_meal)

    create_log(db, action="Ovqat yangilandi", user_id=current_user.id, details=f"Meal ID: {meal_id}, New Name: {meal_update.name}")
    return db_meal

@app.delete("/meals/{meal_id}/", status_code=204)
async def delete_meal(
    meal_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role([Role.ADMIN, Role.MANAGER]))
):
    meal = db.query(MealModel).filter(MealModel.id == meal_id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    
    try:
        meal_name = meal.name
        db.delete(meal)
        db.commit()
        create_log(
            db, 
            action="Ovqat o'chirildi",
            user_id=current_user.id,
            details=f"ID: {meal_id}, Name: {meal_name}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete meal: {str(e)}")
    
    return None

# Serve Meal endpoint
@app.post("/serve-meal/{meal_id}/", response_model=MealServe)
def serve_new_meal(
    meal_id: int,
    meal_serve: MealServeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role([Role.ADMIN, Role.CHEF]))
):
    if meal_serve.meal_id != meal_id:
        raise HTTPException(status_code=400, detail="Meal ID mismatch")

    meal = get_meal(db, meal_id)
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")

    meal_ingredients = get_meal_ingredients_by_meal(db, meal_id)
    for mi in meal_ingredients:
        ingredient = get_ingredient(db, mi.ingredient_id)
        required_quantity = float(mi.quantity) * float(meal_serve.portions)
        current_quantity = float(ingredient.quantity)
        
        if current_quantity < required_quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient quantity of ingredient: {ingredient.name}. Need {required_quantity}g, have {current_quantity}g"
            )
        ingredient.quantity = current_quantity - required_quantity
        check_ingredients_quantity.delay(ingredient.id)  # Asinxron tekshirish

    db.commit()

    db_meal_serve = MealServeModel(
        meal_id=meal_id,
        user_id=current_user.id,
        served_at=datetime.now(),
        portions=meal_serve.portions
    )
    db.add(db_meal_serve)
    db.commit()
    db.refresh(db_meal_serve)

    db_meal_serve = db.query(MealServeModel).options(
        joinedload(MealServeModel.meal)
    ).filter(MealServeModel.id == db_meal_serve.id).first()

    create_log(
        db, 
        action="Ovqat berildi", 
        user_id=current_user.id, 
        details=f"Meal: {db_meal_serve.meal.name}, Portions: {meal_serve.portions}"
    )
    
    return {
        "id": db_meal_serve.id,
        "meal_id": db_meal_serve.meal_id,
        "meal_name": db_meal_serve.meal.name if db_meal_serve.meal else "Unknown meal",
        "user_id": db_meal_serve.user_id,
        "served_at": db_meal_serve.served_at,
        "portions": db_meal_serve.portions
    }

# Serve Meals endpoints
@app.get("/serve-meals/", response_model=List[dict])
def read_meal_serves(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role([Role.ADMIN, Role.CHEF]))
):
    meal_serves = db.query(MealServeModel).options(joinedload(MealServeModel.meal)).offset(skip).limit(limit).all()
    return [
        {
            "id": serve.id,
            "meal_id": serve.meal_id,
            "meal_name": serve.meal.name if serve.meal else "Unknown meal",
            "user_id": serve.user_id,
            "served_at": serve.served_at,
            "portions": serve.portions
        }
        for serve in meal_serves
    ]

@app.get("/serve-meals/user/", response_model=List[dict])
def read_user_meal_serves(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meal_serves = db.query(MealServeModel).options(joinedload(MealServeModel.meal)).filter(MealServeModel.user_id == current_user.id).offset(skip).limit(limit).all()
    return [
        {
            "id": serve.id,
            "meal_id": serve.meal_id,
            "meal_name": serve.meal.name if serve.meal else "Unknown meal",
            "user_id": serve.user_id,
            "served_at": serve.served_at,
            "portions": serve.portions
        }
        for serve in meal_serves
    ]

# Portions endpoint
@app.get("/api/portions/", response_model=List[MealPortions])
def get_portions(
    skip: int = Query(default=0, ge=0, description="Number of items to skip"),
    limit: int = Query(default=100, ge=1, le=1000, description="Maximum number of items to return"),
    db: Session = Depends(get_db)
):
    try:
        portions = get_all_portions(db, skip, limit)
        return portions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching portions: {str(e)}")

# Reports endpoints
@app.get("/reports/monthly/{year}/{month}/", response_model=MonthlyReport)
async def read_monthly_report(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role([Role.ADMIN, Role.MANAGER]))
):
    try:
        task = generate_monthly_report.delay(year, month)
        try:
            report = task.get(timeout=30)  # Increased timeout
            if not report:
                raise HTTPException(status_code=404, detail="Report not found")
                
            return MonthlyReport(**report)
            
        except TimeoutError:
            raise HTTPException(
                status_code=408,
                detail="Report generation timed out"
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error: {str(e)}"
        )

@app.get("/reports/ingredient-usage/", response_model=List[IngredientUsage])
def read_ingredient_usage(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role([Role.ADMIN, Role.MANAGER]))
):
    usage = get_ingredient_usage(db)
    return usage

# Logs endpoint
@app.get("/logs/", response_model=List[dict])
def read_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role([Role.ADMIN, Role.MANAGER]))
):
    logs = db.query(Log).all()
    return [{"action": log.action, "user_id": log.user_id, "details": log.details, "timestamp": log.timestamp} for log in logs]

@app.get("/logs/user/", response_model=List[dict])
def read_user_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logs = db.query(Log).filter(Log.user_id == current_user.id).all()
    return [{"action": log.action, "user_id": log.user_id, "details": log.details, "timestamp": log.timestamp} for log in logs]

@app.get("/serve-meals/me/", response_model=List[dict])
def read_user_meal_serves_me(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meal_serves = db.query(MealServeModel).options(joinedload(MealServeModel.meal)).filter(
        MealServeModel.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return [
        {
            "id": serve.id,
            "meal_id": serve.meal_id,
            "meal_name": serve.meal.name if serve.meal else "Unknown meal",
            "user_id": serve.user_id,
            "served_at": serve.served_at,
            "portions": serve.portions
        }
        for serve in meal_serves    
    ]

@app.get("/reports/monthly/{year}/{month}/status/")
async def get_monthly_report_status(
    year: int,
    month: int,
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role([Role.ADMIN, Role.MANAGER]))
):
    task = AsyncResult(task_id)
    if task.status == "SUCCESS":
        result = task.result
        return {"task_id": task_id, "status": task.status, "result": result}
    return {"task_id": task_id, "status": task.status, "result": None}

@app.get("/logs/meal/", response_model=List[dict])
def read_meal_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role([Role.ADMIN, Role.MANAGER]))
):
    logs = db.query(Log).filter(
        Log.action.in_(["Ovqat yaratildi", "Ovqat yangilandi", "Ovqat o'chirildi"])
    ).all()
    return [
        {
            "action": log.action,
            "user_id": log.user_id,
            "details": log.details,
            "timestamp": log.timestamp
        } for log in logs
    ]

@app.get("/logs/ingredient/", response_model=List[dict])
def read_ingredient_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role([Role.ADMIN, Role.MANAGER]))
):
    logs = db.query(Log).filter(
        Log.action.in_(["Ingrediyent yaratildi", "Ingrediyent yangilandi", "Ingrediyent o'chirildi"])
    ).all()
    return [
        {
            "action": log.action,
            "user_id": log.user_id,
            "details": log.details,
            "timestamp": log.timestamp
        } for log in logs
    ]

@app.post("/tasks/check-ingredients/")
async def trigger_ingredients_check(
    current_user: User = Depends(require_role(Role.MANAGER))
):
    task = check_ingredients_quantity.delay()
    return {"task_id": task.id}

@app.get("/tasks/{task_id}")
async def get_task_status(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    task = AsyncResult(task_id)
    return {
        "task_id": task_id,
        "status": task.status,
        "result": task.result if task.status == "SUCCESS" else None
    }