from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .database import User, get_db  # Relative import
from os import getenv
from dotenv import load_dotenv

# .env faylini o'qish
load_dotenv()

# Xavfsizlik sozlamalari
SECRET_KEY = getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Password hashlash uchun
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Parolni tekshirish"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Parolni hashlash"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """JWT token yaratish"""
    to_encode = data.copy()
    
    # Token muddati
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """JWT token orqali joriy foydalanuvchini olish"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Tokenni tekshirish
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        
    except JWTError:
        raise credentials_exception
        
    # Foydalanuvchini bazadan olish
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
        
    return user

def get_current_active_admin(current_user: User = Depends(get_current_user)) -> User:
    """Foydalanuvchi admin ekanligini tekshirish"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin has permission"
        )
    return current_user

def get_current_active_worker(current_user: User = Depends(get_current_user)) -> User:
    """Foydalanuvchi ishchi ekanligini tekshirish"""
    if current_user.role != "ishchi":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only worker has permission"
        )
    return current_user