from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, JSON, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default="learner") # 'learner' or 'teacher'
    readiness_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    sessions = relationship("TestSession", back_populates="user")

class MockTest(Base):
    __tablename__ = "mock_tests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    level = Column(String) # N1, N2, N3, N4, N5
    duration = Column(Integer, default=120) # in minutes
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    questions = relationship("Question", back_populates="test", cascade="all, delete-orphan")
    sessions = relationship("TestSession", back_populates="test")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("mock_tests.id", ondelete="CASCADE"))
    section = Column(Integer) # 0: Kanji, 1: Grammar/Reading, 2: Listening
    number = Column(Integer)
    type = Column(String) # "Vocabulary", "Reading Comprehension", "Listening"
    question_text = Column(String)
    options = Column(JSON) # Stores list of options: ["A", "B", "C", "D"]
    correct_index = Column(Integer)
    audio_url = Column(String, nullable=True) # For Listening section
    image_url = Column(String, nullable=True) # For visual questions (Mondai 1, 2, etc.)

    # Relationships
    test = relationship("MockTest", back_populates="questions")

class TestSession(Base):
    __tablename__ = "test_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    test_id = Column(Integer, ForeignKey("mock_tests.id", ondelete="CASCADE"))
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    score = Column(Float, nullable=True)
    is_completed = Column(Boolean, default=False)

    # Relationships
    user = relationship("User", back_populates="sessions")
    test = relationship("MockTest", back_populates="sessions")
    answers = relationship("UserAnswer", back_populates="session")

class UserAnswer(Base):
    __tablename__ = "user_answers"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("test_sessions.id", ondelete="CASCADE"))
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"))
    selected_index = Column(Integer)
    is_correct = Column(Boolean)

    # Relationships
    session = relationship("TestSession", back_populates="answers")
