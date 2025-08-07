from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from typing import List

from . import models, schemas, database, crud, auth

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Event Booking API")

@app.post("/register/", response_model=schemas.UserRead)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud.create_user(db, user)

@app.post("/token", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me/", response_model=schemas.UserRead)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.post("/events/", response_model=schemas.EventRead)
def create_event(event: schemas.EventCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.create_event(db, event, current_user.id)

@app.get("/events/", response_model=List[schemas.EventRead])
def get_events(db: Session = Depends(database.get_db)):
    return crud.get_all_events(db)

@app.get("/events/mine/", response_model=List[schemas.EventRead])
def get_my_events(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.get_user_events(db, current_user.id)

@app.post("/events/{event_id}/register", response_model=schemas.EventRead)
def register_event(event_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    event = crud.register_for_event(db, current_user.id, event_id)
    if not event:
        raise HTTPException(status_code=400, detail="Registration failed (already registered or event not found)")
    return event

@app.get("/registrations/mine/", response_model=List[schemas.EventRead])
def get_my_registrations(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.get_user_registrations(db, current_user.id)