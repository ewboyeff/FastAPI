from pydantic import BaseModel
from typing import Optional, List
from enum import Enum

class UserRole(str, Enum):
    TEACHER = "Teacher"
    ADMIN = "Admin"
    SUPERADMIN = "Superadmin"

class UserBase(BaseModel):
    username: str
    email: str
    role: UserRole
    branch_id: int

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    class Config:
        orm_mode = True

class BranchBase(BaseModel):
    name: str
    address: str

class Branch(BranchBase):
    id: int
    class Config:
        orm_mode = True

class GroupBase(BaseModel):
    name: str
    branch_id: int
    teacher_id: int

class Group(GroupBase):
    id: int

    class Config:
        orm_mode = True

class StudentBase(BaseModel):
    user_id: int
    group_id: int

class Student(StudentBase):
    id: int
    class Config:
        orm_mode = True

class StudentCreate(BaseModel):
    username: str
    password: str   
    group_id: int

class StudentUpdate(BaseModel):
    group_id: Optional[int] = None

class StudentDetail(BaseModel):
    id: int
    user: User
    group: Group

    class Config:
        orm_mode = True

class BranchCreate(BaseModel):
    name: str
    address: str

class GroupCreate(BaseModel):
    name: str
    teacher_id: int

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    teacher_id: Optional[int] = None