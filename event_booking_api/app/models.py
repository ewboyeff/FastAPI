from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

registration_table = Table(
    'registrations',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('event_id', Integer, ForeignKey('events.id'), primary_key=True),
    Column('registered_at', DateTime, default=datetime.utcnow)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)

    events = relationship("Event", back_populates="organizer")
    registrations = relationship(
        "Event",
        secondary=registration_table,
        back_populates="participants"
    )

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    date = Column(DateTime, nullable=False)
    location = Column(String, nullable=False)
    organizer_id = Column(Integer, ForeignKey("users.id"))

    organizer = relationship("User", back_populates="events")
    participants = relationship(
        "User",
        secondary=registration_table,
        back_populates="registrations"
    )