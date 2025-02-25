from pydantic import BaseModel

class BookCreate(BaseModel):
    name: str
    author: str
    isbn: int
    publish_year: int

class Book(BaseModel):
    id: int
    name: str
    author: str
    isbn: int
    publish_year: int

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str