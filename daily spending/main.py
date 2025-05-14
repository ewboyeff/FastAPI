from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from typing import Optional, List
from datetime import datetime, date
import logging
import os
import google.generativeai as genai

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI()

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection settings
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = "expense_tracker"
COLLECTION_NAME = "expenses"

# MongoDB client
client = AsyncIOMotorClient(MONGODB_URL)
db = client[DATABASE_NAME]
collection = db[COLLECTION_NAME]

# Gemini API setup
GEMINI_API_KEY = "AIzaSyCR3FgSibqaD_2k5moZYQgAmchiFsi3ZDQ"
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

# Static exchange rates (can be replaced with an API)
EXCHANGE_RATES = {
    "USD": 12700.0,  # 1 USD = 12,700 UZS
    "EUR": 13500.0,  # 1 EUR = 13,500 UZS
    "UZS": 1.0       # 1 UZS = 1 UZS
}

# Pydantic model for expense input
class ExpenseInput(BaseModel):
    title: str  # e.g., "kitob"
    amount: float  # e.g., 25000.0
    currency: str  # e.g., "UZS", "USD", "EUR"
    description: Optional[str] = None

# Pydantic model for expense update
class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None

# Pydantic model for expense stored in MongoDB
class Expense(BaseModel):
    id: Optional[str] = None
    title: str
    amount: float
    currency: str
    amount_uzs: float  # Amount in UZS for consistency
    category: str
    description: Optional[str] = None
    created_at: Optional[datetime] = None

# Convert MongoDB document to dict
def expense_helper(expense) -> dict:
    try:
        if not isinstance(expense, dict):
            raise ValueError("Expense is not a dictionary")
        
        result = {
            "id": str(expense.get("_id", "")),
            "title": str(expense.get("title", "")),
            "amount": float(expense.get("amount", 0.0)),
            "currency": str(expense.get("currency", "UZS")),
            "amount_uzs": float(expense.get("amount_uzs", 0.0)),
            "category": str(expense.get("category", "Others")),
            "description": str(expense.get("description", "")) if expense.get("description") else None,
            "created_at": expense.get("created_at").isoformat() if isinstance(expense.get("created_at"), datetime) else None,
        }
        logger.debug(f"Processed expense: {result}")
        return result
    except Exception as e:
        logger.error(f"Error in expense_helper: {str(e)}, expense: {expense}")
        raise ValueError(f"Invalid expense data: {str(e)}")

# Function to convert amount to UZS
def convert_to_uzs(amount: float, currency: str) -> float:
    if currency not in EXCHANGE_RATES:
        raise ValueError(f"Unsupported currency: {currency}")
    return amount * EXCHANGE_RATES[currency]

# Function to translate Uzbek to English using Gemini
async def translate_to_english(text: str) -> str:
    try:
        prompt = f"""
        Translate the following Uzbek text to English. Return only the translated text, nothing else.
        Text: {text}
        """
        response = await model.generate_content_async(prompt)
        translated_text = response.text.strip()
        logger.debug(f"Translated '{text}' to '{translated_text}'")
        return translated_text
    except Exception as e:
        logger.error(f"Error translating text '{text}': {str(e)}")
        return text

# Function to classify category using Gemini
async def classify_category(title: str, description: Optional[str] = None) -> str:
    try:
        text = (title + " " + (description or "")).strip()
        translated_text = await translate_to_english(text)
        
        prompt = f"""
        Based on the following expense description, suggest an appropriate category. The category should be a single word or short phrase that best describes the type of expense. You are not limited to a predefined list, but choose a logical and commonly used category. If no specific category fits, use "Others".
        Expense: {translated_text}
        Examples:
        - "meat" → Food
        - "cheese" → Food
        - "taxi" → Transport
        - "paynet" → Payment
        - "shirt" → Clothing
        - "book" → Books
        - "soap" → Others
        Return only the category name, nothing else.
        """
        response = await model.generate_content_async(prompt)
        category = response.text.strip().capitalize()
        logger.debug(f"Classified '{translated_text}' as '{category}'")
        
        if not category or category.lower() == "none":
            logger.warning(f"Invalid category '{category}' for '{translated_text}', defaulting to Others")
            return "Others"
        return category
    except Exception as e:
        logger.error(f"Error classifying category for '{text}': {str(e)}")
        return "Others"

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Endpoint to submit expense
@app.post("/expenses/", response_model=Expense)
async def create_expense(expense_input: ExpenseInput):
    try:
        # Validate currency
        if expense_input.currency not in EXCHANGE_RATES:
            raise HTTPException(status_code=400, detail=f"Unsupported currency: {expense_input.currency}")
        
        # Classify category
        category = await classify_category(expense_input.title, expense_input.description)
        
        # Convert amount to UZS
        amount_uzs = convert_to_uzs(expense_input.amount, expense_input.currency)
        
        # Prepare expense document
        expense_data = {
            "title": expense_input.title,
            "amount": expense_input.amount,
            "currency": expense_input.currency,
            "amount_uzs": amount_uzs,
            "category": category,
            "description": expense_input.description,
            "created_at": datetime.utcnow()
        }

        # Insert into MongoDB
        result = await collection.insert_one(expense_data)
        inserted_expense = await collection.find_one({"_id": result.inserted_id})
        
        return expense_helper(inserted_expense)
    except Exception as e:
        logger.error(f"Error in create_expense: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing expense: {str(e)}")

# Endpoint to get expenses with filters
@app.get("/expenses/", response_model=List[Expense])
async def get_expenses(
    category: Optional[str] = Query(None, description="Filter by category"),
    date: Optional[date] = Query(None, description="Filter by date (YYYY-MM-DD)")
):
    try:
        query = {}
        if category:
            query["category"] = category
        if date:
            start_date = datetime.combine(date, datetime.min.time())
            end_date = datetime.combine(date, datetime.max.time())
            query["created_at"] = {"$gte": start_date, "$lte": end_date}
        
        expenses = []
        async for expense in collection.find(query):
            try:
                expenses.append(expense_helper(expense))
            except ValueError as ve:
                logger.warning(f"Skipping invalid expense: {str(ve)}, expense: {expense}")
                continue
        
        # Calculate totals in different currencies
        total_uzs = sum(expense["amount_uzs"] for expense in expenses)
        total_usd = total_uzs / EXCHANGE_RATES["USD"]
        total_eur = total_uzs / EXCHANGE_RATES["EUR"]
        
        logger.info(f"Retrieved {len(expenses)} expenses. Total: {total_uzs} UZS, {total_usd:.2f} USD, {total_eur:.2f} EUR")
        return expenses
    except Exception as e:
        logger.error(f"Error in get_expenses: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching expenses: {str(e)}")

# Endpoint to delete expense
@app.delete("/expenses/{id}")
async def delete_expense(id: str):
    try:
        result = await collection.delete_one({"_id": ObjectId(id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Expense not found")
        logger.info(f"Deleted expense with id: {id}")
        return {"message": "Expense deleted successfully"}
    except Exception as e:
        logger.error(f"Error in delete_expense: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting expense: {str(e)}")

# Endpoint to update expense
@app.put("/expenses/{id}", response_model=Expense)
async def update_expense(id: str, expense_update: ExpenseUpdate):
    try:
        update_data = {k: v for k, v in expense_update.dict().items() if v is not None}
        
        if "amount" in update_data and "currency" in update_data:
            update_data["amount_uzs"] = convert_to_uzs(update_data["amount"], update_data["currency"])
        elif "amount" in update_data:
            # Fetch current currency if not provided
            current_expense = await collection.find_one({"_id": ObjectId(id)})
            if not current_expense:
                raise HTTPException(status_code=404, detail="Expense not found")
            update_data["amount_uzs"] = convert_to_uzs(update_data["amount"], current_expense["currency"])
        elif "currency" in update_data:
            # Fetch current amount if not provided
            current_expense = await collection.find_one({"_id": ObjectId(id)})
            if not current_expense:
                raise HTTPException(status_code=404, detail="Expense not found")
            update_data["amount_uzs"] = convert_to_uzs(current_expense["amount"], update_data["currency"])
        
        if update_data:
            result = await collection.update_one({"_id": ObjectId(id)}, {"$set": update_data})
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="Expense not found")
            
        updated_expense = await collection.find_one({"_id": ObjectId(id)})
        logger.info(f"Updated expense with id: {id}")
        return expense_helper(updated_expense)
    except Exception as e:
        logger.error(f"Error in update_expense: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating expense: {str(e)}")

# Close MongoDB connection on shutdown
@app.on_event("shutdown")
async def shutdown_event():
    client.close()