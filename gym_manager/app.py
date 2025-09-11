from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Dict
import requests
import os
from dotenv import load_dotenv

# .env faylidan muhit o'zgaruvchilarini yuklash
load_dotenv()

# FastAPI ilovasini yaratish
app = FastAPI()

# Statik fayllarni (HTML/CSS) xizmat qilish uchun static papkani ulash
app.mount("/static", StaticFiles(directory="static"), name="static")

# So'rov uchun Pydantic modeli
class RequestModel(BaseModel):
    question: str

# Sport zal ma'lumotlari (prompt uchun kontekst)
GYM_DATA = {
    "services": [
        {"name": "Oylik abonement", "price": "200 000 so'm"},
        {"name": "Yillik abonement", "price": "2 000 000 so'm"},
        {"name": "Shaxsiy murabbiy", "price": "500 000 so'm / oy"},
        {"name": "Guruh yoga darsi", "price": "300 000 so'm / oy"},
        {"name": "Sauna seansi", "price": "50 000 so'm / seans"}
    ],
    "schedule": {
        "Dushanba": ["10:00-12:00", "18:00-20:00"],
        "Seshanba": ["09:00-11:00", "17:00-19:00", "18:00-19:00 (Yoga)"],
        "Chorshanba": ["10:00-12:00", "18:00-20:00"],
        "Payshanba": ["09:00-11:00", "17:00-19:00"],
        "Juma": ["10:00-12:00", "18:00-20:00", "18:00-19:00 (Yoga)"],
        "Shanba": ["11:00-13:00", "16:00-18:00"],
        "Yakshanba": ["11:00-13:00", "16:00-18:00"]
    }
}

# Gemini API sozlamalari
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyB0Um86QcHzm7YjxHeqOUrOQEsL2O6xVJ4")
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"

# API endpoint: mijoz so'rovlariga Gemini API orqali javob berish
@app.post("/api/gym-manager")
async def gym_manager(request: RequestModel) -> Dict[str, str]:
    question = request.question
    
    # Ma'lumotlarni JSON stringiga aylantirish
    gym_data_json = str(GYM_DATA).replace("'", '"')  # JSON formatiga moslashtirish
    
    # Kuchaytirilgan prompt: rol, kontekst, to'lov simulatsiyasi
    prompt = f"""Siz sport zal menejerisiz. Quyidagi ma'lumotlarga asoslanib, mijoz savoliga uzbek tilida professional, aniq va qisqa javob bering. 
Agar savol abonement yoki xizmatlar haqida bo'lsa, aniq narxni ayting. Jadval haqida bo'lsa, bo'sh vaqtlarni va maxsus darslarni (masalan, yoga) ko'rsating, band qilishni taklif qiling.
Agar mijoz online to'lov so'rasa, 4-raqamli tasdiqlash kodi generatsiya qiling (masalan, 4729) va "To'lov tasdiqlash kodi: [kod]. Kodni kiriting" deb javob bering.
Agar mijoz tasdiqlash kodi kiritsa, "To'lov tasdiqlandi, ma'lumotlar yuborildi" deb javob bering va band qilishni taklif qiling.
Suhbatni davom ettiring, qo'shimcha savollar bering. Umumiy javob bermang, faqat berilgan ma'lumotlarga tayaning.

Sport zal ma'lumotlari: {gym_data_json}

Mijoz savoli: {question}"""

    # Gemini API'ga so'rov yuborish
    try:
        response = requests.post(
            GEMINI_API_URL,
            headers={"Content-Type": "application/json"},
            json={
                "contents": [
                    {
                        "parts": [
                            {"text": prompt}
                        ]
                    }
                ],
                "generationConfig": {
                    "maxOutputTokens": 300,  # Javobni biroz uzunroq qilish
                    "temperature": 0.7  # Tabiiylik uchun
                }
            }
        )
        response.raise_for_status()  # Xatolarni tekshirish
        data = response.json()
        gemini_response = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "Javob olishda xatolik yuz berdi.")
    except requests.RequestException as e:
        gemini_response = f"Server bilan bog'lanishda xatolik! Xato: {str(e)}"
    
    return {"response": gemini_response.strip()}  # Bo'sh joylarni tozalash

# Veb-interfeys uchun asosiy sahifa
@app.get("/")
async def get_index():
    return FileResponse("static/index.html")