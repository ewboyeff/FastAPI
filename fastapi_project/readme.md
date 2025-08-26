# Service Platform API

FastAPI-da yaratilgan xizmat ko'rsatish platformasi uchun REST API.

## O'rnatish

1. Python 3.11.0 o'rnatish

2. Virtual muhit yaratish va faollashtirish:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

3. Kerakli kutubxonalarni o'rnatish:
```bash
pip install -r requirements.txt
```

4. .env faylini yaratish:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## Ishga tushirish

```bash
uvicorn app.main:app --reload
```

API dokumentatsiyasi: http://localhost:8000/docs

## API Endpointlar

### Autentifikatsiya
- POST /register - Ro'yxatdan o'tish
- POST /login - Tizimga kirish

### Foydalanuvchilar
- GET /users/me - O'z profili
- GET /users - Barcha foydalanuvchilar (Admin uchun)

### Buyurtmalar
- POST /orders - Yangi buyurtma yaratish
- GET /orders - Buyurtmalarni ko'rish
- PUT /orders/{order_id}/status - Buyurtma statusini yangilash

### To'lovlar
- POST /payments/{order_id} - To'lov qilish
- GET /payments/history - To'lovlar tarixi

### WebSocket
- WS /ws/{user_id} - Real-time xabarlar uchun

