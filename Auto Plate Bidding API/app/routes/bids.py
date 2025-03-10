from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Bid, AutoPlate, User
from app.schemas import BidCreate, BidResponse
from app.auth import get_current_user
from datetime import datetime
from app.schemas import BidCreate, BidResponse, BidWinnerResponse  
from app.utils import send_winner_notification  # ✅ Yangi qo‘shildi!


router = APIRouter(
    prefix="/bids",
    tags=["Bidding"]
)

# 🔹 1️⃣ Barcha takliflarni olish (Admin uchun)
@router.get("/", response_model=list[BidResponse])
def get_all_bids(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_staff:
        raise HTTPException(status_code=403, detail="Only admins can see all bids")
    
    return db.query(Bid).all()

# 🔹 2️⃣ Bitta avtomobil raqami uchun barcha takliflarni olish
@router.get("/{plate_id}/", response_model=list[BidResponse])
def get_bids_for_plate(plate_id: int, db: Session = Depends(get_db)):
    return db.query(Bid).filter(Bid.plate_id == plate_id).all()

# 🔹 3️⃣ Yangi narx taklif qilish
@router.post("/", response_model=BidResponse)
def create_bid(bid: BidCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    plate = db.query(AutoPlate).filter(AutoPlate.id == bid.plate_id, AutoPlate.is_active == True).first()
    if not plate:
        raise HTTPException(status_code=404, detail="Plate not found or not active")

    highest_bid = db.query(Bid).filter(Bid.plate_id == bid.plate_id).order_by(Bid.amount.desc()).first()
    if highest_bid and bid.amount <= highest_bid.amount:
        raise HTTPException(status_code=400, detail="Your bid must be higher than the current highest bid")

    new_bid = Bid(
        plate_id=bid.plate_id,
        user_id=current_user.id,
        amount=bid.amount,
        created_at=datetime.utcnow()
    )
    db.add(new_bid)
    db.commit()
    db.refresh(new_bid)
    
    return new_bid

# 🔹 4️⃣ Eng yuqori taklifni olish
@router.get("/highest/{plate_id}/", response_model=BidResponse)
def get_highest_bid(plate_id: int, db: Session = Depends(get_db)):
    highest_bid = db.query(Bid).filter(Bid.plate_id == plate_id).order_by(Bid.amount.desc()).first()
    if not highest_bid:
        raise HTTPException(status_code=404, detail="No bids found for this plate")
    return highest_bid
# 🔹 5️⃣ Bidding yakunlash va g‘olibni aniqlash
@router.post("/close/{plate_id}/", response_model=BidWinnerResponse)
def close_bidding(plate_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_staff:
        raise HTTPException(status_code=403, detail="Only admins can close bidding")

    highest_bid = db.query(Bid).filter(Bid.plate_id == plate_id).order_by(Bid.amount.desc()).first()
    if not highest_bid:
        raise HTTPException(status_code=404, detail="No bids found for this plate")

    plate = db.query(AutoPlate).filter(AutoPlate.id == plate_id).first()
    if not plate:
        raise HTTPException(status_code=404, detail="Plate not found")

    # 🔹 `plate_id` yoki `highest_bid` None bo‘lmasligi kerak
    if not plate_id or not highest_bid.user_id:
        raise HTTPException(status_code=500, detail="Invalid data: plate_id or winner_id is None")

    # 🔹 G‘olib foydalanuvchini raqam egasi sifatida belgilaymiz
    plate.is_active = False  # Bidding tugadi
    plate.owner_id = highest_bid.user_id  # G‘olib foydalanuvchi
    db.commit()

    return {"plate_id": plate_id, "winner_id": highest_bid.user_id, "amount": highest_bid.amount}
