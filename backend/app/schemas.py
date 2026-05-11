from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# --- User Schemas ---
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "learner"

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    readiness_score: Optional[float] = 0.0
    role: Optional[str] = "learner"

    class Config:
        from_attributes = True

# --- Question Schemas ---
class QuestionCreate(BaseModel):
    section: int = 0
    number: int = 1
    type: str = "Multiple Choice"
    question_text: str
    options: List[str]
    correct_index: int
    audio_url: Optional[str] = None
    image_url: Optional[str] = None

# --- Test Schemas ---
class MockTestCreate(BaseModel):
    title: str
    level: str
    duration: int
    questions: List[QuestionCreate] = []

# --- Question Schemas ---
class QuestionLearnerResponse(BaseModel):
    id: int
    section: int
    number: int
    type: str
    question_text: str
    options: List[str]
    audio_url: Optional[str] = None
    image_url: Optional[str] = None
    audio_metadata: Optional[dict] = None

    class Config:
        from_attributes = True

class QuestionResponse(BaseModel):
    id: int
    section: int
    number: int
    type: str
    question_text: str
    options: List[str]
    correct_index: int
    audio_url: Optional[str] = None
    image_url: Optional[str] = None
    audio_metadata: Optional[dict] = None

    class Config:
        from_attributes = True

# --- Test Schemas ---
class MockTestResponse(BaseModel):
    id: int
    title: str
    level: str
    duration: int
    created_at: datetime
    questions: List[QuestionResponse] = []

    class Config:
        from_attributes = True

# --- Exam Submission Schemas ---
class AnswerSubmit(BaseModel):
    question_id: int
    selected_index: int

class TestSubmit(BaseModel):
    session_id: int
    answers: List[AnswerSubmit]

class AudioGenerate(BaseModel):
    text: str

class TestResult(BaseModel):
    score_percentage: float
    correct_answers: int
    total_questions: int
    section_scores: Optional[dict] = None

# --- Audio Generation Schemas ---
class AudioMetadata(BaseModel):
    duration_seconds: int
    language: str
    voice: str
    generated_at: str
    transcript: str

class AudioGenerationResponse(BaseModel):
    question_id: int
    audio_url: str
    metadata: AudioMetadata
    status: str

    class Config:
        from_attributes = True

# --- Test Session Schemas ---
class TestSessionResponse(BaseModel):
    id: int
    user_id: int
    test_id: int
    start_time: datetime
    is_completed: bool

    class Config:
        from_attributes = True
