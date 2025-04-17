from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# SQLite ma’lumotlar bazasi
SQLALCHEMY_DATABASE_URL = "sqlite:///./surplus_saver.db"

# Engine va session yaratish
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Baza modellari uchun asos
Base = declarative_base()

# Har bir so‘rov uchun session olish funksiyasi
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()