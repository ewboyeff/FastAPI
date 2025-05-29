from celery import Celery
from database import SessionLocal
from models import Ingredient, Log, MealServe, Meal
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from sqlalchemy import func

# Configure Celery for Windows
celery_app = Celery(
    'tasks',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0',
    broker_connection_retry_on_startup=True
)

# Celery Configuration
celery_app.conf.update(
    worker_pool_restarts=True,
    worker_max_tasks_per_child=1,
    task_track_started=True,
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    enable_utc=True,
    worker_concurrency=1  # Use single worker for Windows
)

# Database session management
def get_db():
    db = None
    try:
        db = SessionLocal()
        return db
    finally:
        if db:
            db.close()

@celery_app.task
def check_ingredients_quantity(ingredient_id: int):
    """Check ingredient stock levels"""
    db = get_db()
    try:
        ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
        if ingredient and ingredient.quantity < ingredient.minimum_quantity:
            log_entry = Log(
                user_id=None,
                action="Stock Check",
                details=f"Low stock alert: {ingredient.name} ({ingredient.quantity}/{ingredient.minimum_quantity})",
                timestamp=datetime.utcnow()
            )
            db.add(log_entry)
            db.commit()
            return f"Alert logged for {ingredient.name}"
        return "No action needed"
    finally:
        db.close()

@celery_app.task(bind=True)
def generate_monthly_report(self, year: int, month: int):
    """Generate monthly report"""
    db = get_db()
    try:
        start_date = datetime(year, month, 1)
        end_date = datetime(year, month + 1, 1) if month < 12 else datetime(year + 1, 1, 1)
        result = (
            db.query(
                MealServe.meal_id,
                func.sum(MealServe.portions).label("total_portions")
            )
            .filter(MealServe.served_at >= start_date, MealServe.served_at < end_date)
            .group_by(MealServe.meal_id)
            .all()
        )
        
        report = [
            {"meal_id": meal_id, "total_portions": float(total_portions)}
            for meal_id, total_portions in result
        ]
        
        total_served = sum(item["total_portions"] for item in report)
        total_possible = len(report) * 100
        difference_percentage = ((total_possible - total_served) / total_possible) * 100 if total_possible > 0 else 0
        
        warning = "Low servings!" if total_served < total_possible * 0.1 else ""
        
        return {
            "year": year,
            "month": month,
            "total_served": int(total_served),
            "total_possible": total_possible,
            "difference_percentage": round(difference_percentage, 2),
            "warning": warning
        }
    except Exception as e:
        self.retry(exc=e, countdown=5, max_retries=3)
    finally:
        db.close()