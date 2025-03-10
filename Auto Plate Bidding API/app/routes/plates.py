from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AutoPlate, User
from app.schemas import AutoPlateCreate, AutoPlateResponse
from app.auth import get_current_user
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List  # ✅ List import qilindi
from app import models, schemas
from app.database import get_db
from sqlalchemy.sql import func 

router = APIRouter(
    prefix="/plates",
    tags=["AutoPlates"]
)

# 🔹 1️⃣ Barcha avtomobil raqamlarini olish
@router.get("/plates/", response_model=List[schemas.AutoPlateResponse])
def get_all_plates(db: Session = Depends(get_db)):
    plates = db.query(
        models.AutoPlate.id,
        models.AutoPlate.plate_number,
        models.AutoPlate.description,
        models.AutoPlate.deadline,
        models.AutoPlate.is_active,
        func.coalesce(func.max(models.Bid.amount), 0).label("highest_bid")  # ✅ Eng yuqori stavka
    ).outerjoin(models.Bid, models.AutoPlate.id == models.Bid.plate_id) \
     .group_by(models.AutoPlate.id).all()

    return [schemas.AutoPlateResponse(
        id=plate.id,
        plate_number=plate.plate_number,
        description=plate.description,
        deadline=plate.deadline,
        is_active=plate.is_active,
        highest_bid=plate.highest_bid
    ) for plate in plates]

# 🔹 2️⃣ Yangi avtomobil raqami yaratish (faqat admin)
@router.post("/", response_model=AutoPlateResponse)
def create_plate(plate: AutoPlateCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_staff:
        raise HTTPException(status_code=403, detail="Only admins can create plates")
    
    existing_plate = db.query(AutoPlate).filter(AutoPlate.plate_number == plate.plate_number).first()
    if existing_plate:
        raise HTTPException(status_code=400, detail="Plate number already exists")

    new_plate = AutoPlate(
        plate_number=plate.plate_number,
        description=plate.description,
        deadline=plate.deadline,
        created_by=current_user.id
    )
    db.add(new_plate)
    db.commit()
    db.refresh(new_plate)
    
    return new_plate

# 🔹 3️⃣ Bitta avtomobil raqami haqida ma'lumot olish
@router.get("/{plate_id}/", response_model=AutoPlateResponse)
def get_plate(plate_id: int, db: Session = Depends(get_db)):
    plate = db.query(AutoPlate).filter(AutoPlate.id == plate_id).first()
    if not plate:
        raise HTTPException(status_code=404, detail="Plate not found")
    return plate

# 🔹 4️⃣ Avtomobil raqamini o‘zgartirish (faqat admin)
@router.put("/{plate_id}/", response_model=AutoPlateResponse)
def update_plate(plate_id: int, plate_update: AutoPlateCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_staff:
        raise HTTPException(status_code=403, detail="Only admins can update plates")

    plate = db.query(AutoPlate).filter(AutoPlate.id == plate_id).first()
    if not plate:
        raise HTTPException(status_code=404, detail="Plate not found")

    plate.plate_number = plate_update.plate_number
    plate.description = plate_update.description
    plate.deadline = plate_update.deadline

    db.commit()
    db.refresh(plate)
    
    return plate

# 🔹 5️⃣ Avtomobil raqamini o‘chirish (faqat admin)
@router.delete("/{plate_id}/")
def delete_plate(plate_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_staff:
        raise HTTPException(status_code=403, detail="Only admins can delete plates")

    plate = db.query(AutoPlate).filter(AutoPlate.id == plate_id).first()
    if not plate:
        raise HTTPException(status_code=404, detail="Plate not found")

    db.delete(plate)
    db.commit()
    
    return {"message": "Plate deleted successfully"}
