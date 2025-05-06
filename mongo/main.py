from fastapi import FastAPI
from models import Users
from db import collection


app = FastAPI()

@app.get("/users/")
def get_users():
    users = []
    for user in collection.find():
        user["_id"] = str(user["_id"])
        users.append(user)
    return users

@app.post("/users/")
def create_user(user: Users):
    result = collection.insert_one(user.dict())
    return {"id": str(result.inserted_id)}.en