from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserResponse
from app.auth import get_password_hash, create_access_token, verify_password, get_current_user
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

# 🔹 1️⃣ Foydalanuvchini ro‘yxatdan o‘tkazish
@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    new_user = User(username=user.username, email=user.email, password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

# 🔹 2️⃣ Tizimga kirish (login) va token olish
@router.post("/login/")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

# 🔹 3️⃣ Foydalanuvchining profilini olish
@router.get("/me/", response_model=UserResponse)
def read_users_me(current_user: UserResponse = Depends(get_current_user)):
    return current_user


@router.post("/create_admin/")
def create_admin(db: Session = Depends(get_db)):
    # Foydalanuvchi bazada bor-yo‘qligini tekshiramiz
    existing_admin = db.query(User).filter(User.username == "admin").first()
    if existing_admin:
        return {"message": "Admin account already exists!"}

    # Parolni hash qilish
    from app.auth import get_password_hash
    hashed_password = get_password_hash("77")

    # Yangi admin yaratish
    admin_user = User(username="admin", email="admin@example.com", password=hashed_password, is_staff=True)
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)

    return {"message": "Admin user created successfully!", "username": "admin", "password": "77"}
