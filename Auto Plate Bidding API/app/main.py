from fastapi import FastAPI
from app.database import Base, engine
from app.routes import users, plates, bids  # ✅ Bids qo‘shilgan!

app = FastAPI()

# Ma'lumotlar bazasini yaratish
Base.metadata.create_all(bind=engine)

# Yo‘nalishlarni qo‘shish
app.include_router(users.router)
app.include_router(plates.router)
app.include_router(bids.router)  # ✅ Bidding qo‘shildi!

@app.get("/")
def read_root():
    return {"message": "Auto Plate Bidding API ishlayapti!"}
