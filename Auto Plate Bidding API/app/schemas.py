from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# 🔹 Foydalanuvchi ro‘yxatdan o‘tish modeli
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

# 🔹 Foydalanuvchi javob modeli
class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_staff: bool

    class Config:
        from_attributes = True

# 🔹 Avtomobil raqamini yaratish modeli
class AutoPlateCreate(BaseModel):
    plate_number: str
    description: str
    deadline: datetime

# 🔹 Avtomobil raqamining javob modeli (read uchun)
class AutoPlateResponse(BaseModel):
    id: int
    plate_number: str
    description: str
    deadline: datetime
    is_active: bool
    highest_bid: Optional[float] = None  # ✅ Eng yuqori stavkani qo‘shdik!

    class Config:
        from_attributes = True
# 🔹 Taklif yaratish modeli
class BidCreate(BaseModel):
    plate_id: int
    amount: float

# 🔹 Taklif javob modeli
class BidResponse(BaseModel):
    id: int
    plate_id: Optional[int]  # ✅ `None` bo‘lsa ham xato bermaydi
    user_id: int
    amount: float
    created_at: datetime

    class Config:
        from_attributes = True

# 🔹 G‘olib aniqlash uchun schema
class BidWinnerResponse(BaseModel):
    plate_id: int
    winner_id: int
    amount: float
