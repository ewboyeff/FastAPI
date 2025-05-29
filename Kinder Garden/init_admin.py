from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, User  # Base va User modellarini import qilish
from schemas import UserCreate, Role
from crud import create_user

def init_admin():
    # Ma'lumotlar bazasi jadvallarini avval yaratish
    print("Jadvallarni yaratish boshlanmoqda...")
    Base.metadata.create_all(bind=engine)
    print("Jadvallar yaratildi.")

    # Database session
    db: Session = SessionLocal()
    try:
        # Admin foydalanuvchi bor-yo‘qligini tekshirish
        print("Admin foydalanuvchisini tekshirish...")
        existing_admin = db.query(User).filter(User.username == "admin").first()
        if not existing_admin:
            # Admin foydalanuvchi yaratish
            admin_user = UserCreate(
                username="admin",
                password="admin123",  # Parol
                role=Role.ADMIN
            )
            create_user(db, admin_user)
            print("Admin foydalanuvchi yaratildi: username=admin, parol=admin123")
        else:
            print("Admin foydalanuvchi allaqachon mavjud.")
    except Exception as e:
        print(f"Xato yuz berdi: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    init_admin()