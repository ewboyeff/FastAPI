from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Enum
from sqlalchemy.orm import relationship
from database import Base
import enum
class UserRole(str, enum.Enum):
    TEACHER = "Teacher"
    ADMIN = "Admin"
    SUPERADMIN = "Superadmin"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(UserRole))
    is_active = Column(Boolean, default=True)
    branch_id = Column(Integer, ForeignKey("branches.id"))
    branch = relationship("Branch", back_populates="users")
    teacher_groups = relationship("Group", back_populates="teacher")
    students = relationship("Student", back_populates="user")

class Branch(Base):
    __tablename__ = "branches"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    address = Column(String)
    users = relationship("User", back_populates="branch")
    groups = relationship("Group", back_populates="branch")

class Group(Base):
    __tablename__ = "groups"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"))
    teacher_id = Column(Integer, ForeignKey("users.id"))
    branch = relationship("Branch", back_populates="groups")
    teacher = relationship("User", back_populates="teacher_groups")
    students = relationship("Student", back_populates="group")

class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    group_id = Column(Integer, ForeignKey("groups.id"))
    user = relationship("User", back_populates="students")
    group = relationship("Group", back_populates="students")