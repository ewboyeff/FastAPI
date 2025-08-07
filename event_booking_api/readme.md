# Event Booking API

Event Booking API - bu foydalanuvchilar o'zlarining tadbirlarini yaratishi va boshqa tadbirlarga ro'yxatdan o'tishi uchun mo'ljallangan RESTful API.

## 🚀 Texnologiyalar

- **FastAPI** - Modern, tez va Python web framework
- **SQLAlchemy** - Python SQL toolkit va ORM
- **SQLite** - Ma'lumotlar bazasi
- **JWT (PyJWT)** - JSON Web Token autentifikatsiya
- **Bcrypt** - Parolni hash qilish uchun
- **Pydantic** - Ma'lumotlar validatsiyasi
- **Uvicorn** - ASGI server

## 📋 Loyiha tuzilishi

```
event-booking-api/
├── main.py          # FastAPI ilovasi va API endpointlar
├── models.py        # SQLAlchemy modellari
├── schemas.py       # Pydantic validatsiya sxemalari
├── database.py      # Ma'lumotlar bazasi konfiguratsiyasi
├── auth.py          # JWT autentifikatsiya
├── crud.py          # CRUD operatsiyalar
├── requirements.txt # Kutubxonalar ro'yxati
└── README.md        # Loyiha haqida ma'lumot
```

## 🛠️ O'rnatish

1. **Repository'ni clone qiling:**
```bash
git clone https://github.com/ewboyeff/FastAPI/event-booking-api.git
cd event-booking-api
```
2. **Virtual environment yarating:**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# yoki
venv\Scripts\activate     # Windows
```

3. **Kerakli kutubxonalarni o'rnating:**
```bash
pip install -r requirements.txt
```

4. **requirements.txt fayli:**
```
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
email-validator==2.1.0
```

## 🚀 Ishga tushirish

1. **Serverni ishga tushiring:**
```bash
uvicorn main:app --reload
```

2. **API dokumentatsiya:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 📊 Ma'lumotlar bazasi modellari

### User (Foydalanuvchi)
- `id` - Primary key
- `username` - Foydalanuvchi nomi (unique)
- `email` - Email manzil (unique)  
- `password` - Hash qilingan parol

### Event (Tadbir)
- `id` - Primary key
- `title` - Tadbir nomi
- `description` - Tadbir tavsifi
- `date` - Tadbir sanasi
- `location` - Tadbir manzili
- `organizer_id` - Tashkilotchi ID (Foreign key)

### Registration (Ro'yxat)
- `user_id` - Foydalanuvchi ID (Foreign key)
- `event_id` - Tadbir ID (Foreign key)
- `registered_at` - Ro'yxatdan o'tgan sana

## 🔐 API Endpointlar

### Autentifikatsiya
- `POST /register/` - Yangi foydalanuvchi ro'yxatdan o'tish
- `POST /token` - Login qilish va JWT token olish

### Foydalanuvchi
- `GET /me/` - Joriy foydalanuvchi ma'lumotlari

### Tadbirlar
- `POST /events/` - Yangi tadbir yaratish 🔒
- `GET /events/` - Barcha tadbirlarni ko'rish
- `GET /events/mine/` - O'z tadbirlarini ko'rish 🔒
- `POST /events/{event_id}/register` - Tadbir uchun ro'yxatdan o'tish 🔒
- `GET /registrations/mine/` - O'z ro'yxatdan o'tgan tadbirlarini ko'rish 🔒

🔒 - Autentifikatsiya talab qilinadi (Bearer token)

## 💡 Foydalanish misoli

### 1. Ro'yxatdan o'tish:
```bash
curl -X POST "http://localhost:8000/register/" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com", 
    "password": "securepassword123"
  }'
```

### 2. Login qilish:
```bash
curl -X POST "http://localhost:8000/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=john_doe&password=securepassword123"
```

### 3. Tadbir yaratish:
```bash
curl -X POST "http://localhost:8000/events/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Python Conference 2024",
    "description": "Yillik Python conference", 
    "date": "2024-06-15T10:00:00",
    "location": "Tashkent, Uzbekistan"
  }'
```

### 4. Tadbir uchun ro'yxatdan o'tish:
```bash
curl -X POST "http://localhost:8000/events/1/register" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔒 Xavfsizlik

- Parollar **bcrypt** algoritmi bilan hash qilinadi
- JWT token autentifikatsiya ishlatiladi
- Ma'lumotlar bazasi bog'lanishi SQLAlchemy ORM orqali himoyalangan
- Input validatsiya Pydantic orqali amalga oshiriladi

## 📝 Response Format

### Muvaffaqiyatli javob:
```json
{
  "id": 1,
  "title": "Python Conference 2024",
  "description": "Yillik Python conference",
  "date": "2024-06-15T10:00:00",
  "location": "Tashkent, Uzbekistan",
  "organizer_id": 1
}
```

### Xato javob:
```json
{
  "detail": "Username already registered"
}
```
## 👨‍💻 Muallif

**[Dilshod]** - [GitHub](https://github.com/ewboyeff)
