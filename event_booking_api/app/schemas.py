from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: int
    class Config:
        orm_mode = True

class EventBase(BaseModel):
    title: str
    description: str
    date: datetime
    location: str

class EventCreate(EventBase):
    pass

class EventRead(EventBase):
    id: int
    organizer_id: int
    class Config:
        orm_mode = True

class RegistrationBase(BaseModel):
    event_id: int

class RegistrationRead(BaseModel):
    event_id: int
    user_id: int
    registered_at: datetime
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None