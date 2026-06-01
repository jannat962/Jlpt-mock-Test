from pydantic import BaseModel, EmailStr
from typing import Any, List, Optional
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

class UserMetricsResponse(BaseModel):
    available_tests: int
    completed_sessions: int
    active_sessions: int
    readiness_score: float
    mastery_points: int
    ai_badges: int
    growth_goals: int
    active_courses: int
    streak_progress: int

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
    difficulty: Optional[str] = None
    explanation: Optional[str] = None
    tags: Optional[List[str]] = []
    audio_url: Optional[str] = None
    image_url: Optional[str] = None

# --- AI Generation Schemas ---
class AIGenerateContent(BaseModel):
    vocabulary: Optional[str] = ''
    grammar: Optional[str] = ''
    reading: Optional[str] = ''

class AIGenerateRequest(BaseModel):
    level: str
    section: str
    count: int
    question_types: List[str]
    difficulty_mode: str
    include_explanations: bool = True
    prevent_duplicates: bool = True
    tag_by_category: bool = True
    content: AIGenerateContent

class ListeningAudioRequest(BaseModel):
    script: str
    speaker_count: int = 1
    voice_style: str = 'female'
    speech_speed: str = 'standard'
    generate_questions: bool = True
    level: str = 'N5'
    question_count: int = 5
    section: str = 'listening'

class QuestionTemplateCreate(BaseModel):
    name: str
    level: str
    section: str
    questions: List[QuestionCreate]
    template_metadata: Optional[dict] = {}

class QuestionTemplateResponse(BaseModel):
    id: int
    name: str
    level: str
    section: str
    questions: List[QuestionCreate]
    template_metadata: Optional[dict] = {}
    created_at: datetime

class TeacherSettingsUpdate(BaseModel):
    module_toggles: dict

class TeacherSettingsResponse(BaseModel):
    user_id: int
    module_toggles: dict
    created_at: datetime

class LevelConfigItem(BaseModel):
    level: str
    duration: int
    questions: int
    pass_score: float

class LevelConfigResponse(BaseModel):
    levels: List[LevelConfigItem]

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
    difficulty: Optional[str] = None
    explanation: Optional[str] = None
    tags: Optional[List[str]] = []
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
    difficulty: Optional[str] = None
    explanation: Optional[str] = None
    tags: Optional[List[str]] = []
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
