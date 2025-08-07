from sqlalchemy.orm import Session
from . import models, schemas, auth
from datetime import datetime

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(username=user.username, email=user.email, password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_event(db: Session, event: schemas.EventCreate, user_id: int):
    db_event = models.Event(**event.dict(), organizer_id=user_id)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def get_user_events(db: Session, user_id: int):
    return db.query(models.Event).filter(models.Event.organizer_id == user_id).all()

def get_all_events(db: Session):
    return db.query(models.Event).all()

def register_for_event(db: Session, user_id: int, event_id: int):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not event or not user:
        return None
    if event in user.registrations:
        return None
    user.registrations.append(event)
    db.commit()
    return event

def get_user_registrations(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    return user.registrations if user else []