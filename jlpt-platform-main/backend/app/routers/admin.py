from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List
from jose import jwt, JWTError
from .. import models, schemas
from ..database import get_db
from ..auth_utils import SECRET_KEY, ALGORITHM

router = APIRouter()
security = HTTPBearer()

# Authentication and role checking
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> int:
    """Extract and validate JWT token, return authenticated user ID"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_teacher_role(current_user: int = Depends(get_current_user), db: Session = Depends(get_db)) -> models.User:
    """Verify user is a teacher"""
    user = db.query(models.User).filter(models.User.id == current_user).first()
    if not user or user.role != 'teacher':
        raise HTTPException(status_code=403, detail="Teacher role required for this action")
    return user

# --- Mock Test Management ---

@router.get("/", response_model=List[schemas.MockTestResponse])
def list_tests(teacher: models.User = Depends(require_teacher_role), db: Session = Depends(get_db)):
    """List all tests (teacher only)"""
    return db.query(models.MockTest).all()

@router.post("/", response_model=schemas.MockTestResponse)
def create_test(test: schemas.MockTestCreate, teacher: models.User = Depends(require_teacher_role), db: Session = Depends(get_db)):
    """Create a new test (teacher only)"""
    # 1. Create the MockTest
    db_test = models.MockTest(
        title=test.title,
        level=test.level,
        duration=test.duration
    )
    db.add(db_test)
    db.commit()
    db.refresh(db_test)
    
    # 2. Add questions if provided
    for q in test.questions:
        db_q = models.Question(
            test_id=db_test.id,
            section=q.section,
            number=q.number,
            type=q.type,
            question_text=q.question_text,
            options=q.options,
            correct_index=q.correct_index,
            audio_url=q.audio_url,
            image_url=q.image_url
        )
        db.add(db_q)
    
    db.commit()
    db.refresh(db_test)
    return db_test

@router.put("/{test_id}", response_model=schemas.MockTestResponse)
def update_test(test_id: int, test_update: schemas.MockTestCreate, teacher: models.User = Depends(require_teacher_role), db: Session = Depends(get_db)):
    """Update a test (teacher only)"""
    db_test = db.query(models.MockTest).filter(models.MockTest.id == test_id).first()
    if not db_test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    # Update test metadata
    db_test.title = test_update.title
    db_test.level = test_update.level
    db_test.duration = test_update.duration
    
    # Update questions: Clear and recreate for simplicity
    # Manual cleanup of dependent answers to avoid foreign key violations
    db.query(models.UserAnswer).filter(models.UserAnswer.question_id.in_(
        db.query(models.Question.id).filter(models.Question.test_id == test_id)
    )).delete(synchronize_session=False)
    
    db.query(models.Question).filter(models.Question.test_id == test_id).delete()
    
    for q in test_update.questions:
        db_q = models.Question(
            test_id=test_id,
            section=q.section,
            number=q.number,
            type=q.type,
            question_text=q.question_text,
            options=q.options,
            correct_index=q.correct_index,
            audio_url=q.audio_url,
            image_url=q.image_url
        )
        db.add(db_q)
    
    db.commit()
    db.refresh(db_test)
    return db_test

@router.delete("/{test_id}")
def delete_test(test_id: int, teacher: models.User = Depends(require_teacher_role), db: Session = Depends(get_db)):
    """Delete a test (teacher only)"""
    db_test = db.query(models.MockTest).filter(models.MockTest.id == test_id).first()
    if not db_test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    db.delete(db_test)
    db.commit()
    return {"message": "Test deleted successfully"}

# --- AI Question Generation ---

@router.post("/ai/generate-questions")
def generate_ai_questions(request: schemas.AIGenerateRequest, teacher: models.User = Depends(require_teacher_role), db: Session = Depends(get_db)):
    """Generate AI questions based on syllabus content"""
    import json
    from anthropic import Anthropic
    import os

    # Generate questions using Claude API or fallback generator
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    content_parts = []
    if request.content.vocabulary:
        content_parts.append(f"Vocabulary:\n{request.content.vocabulary}")
    if request.content.grammar:
        content_parts.append(f"Grammar:\n{request.content.grammar}")
    if request.content.reading:
        content_parts.append(f"Reading:\n{request.content.reading}")
    content_text = "\n\n".join(content_parts).strip()
    if not content_text:
        raise HTTPException(status_code=400, detail="Please provide syllabus content for at least one section.")
    
    if api_key:
        try:
            client = Anthropic()
            prompt = f"""Generate exactly {request.count} unique JLPT {request.level} {request.section} questions.

Content to base questions on:
{content_text}

Requirements:
- All questions must be at {request.level} level
- Include explanations for each answer
- Format: JSON array with {{type, question_text, options: [4 options], correct_answer_index, difficulty, explanation, tags}}
- Difficulty: {request.difficulty_mode}
- Question types: {', '.join(request.question_types) if request.question_types else 'Multiple Choice'}

Return ONLY valid JSON array, no markdown or extra text."""

            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=4000,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            content = response.content[0].text
            # Clean up markdown wrapping
            if content.startswith('```json'):
                content = content[7:]
            if content.startswith('```'):
                content = content[3:]
            if content.endswith('```'):
                content = content[:-3]
            
            questions = json.loads(content.strip())
            return questions
        except Exception as e:
            print(f"Error calling Claude API: {e}")
            # Fallback to stub generator
    
    # Fallback: simple stub generator
    section_text = request.content.vocabulary or request.content.grammar or request.content.reading or request.section
    stub_questions = []
    for i in range(request.count):
        stub_questions.append({
            "type": "MCQ",
            "level": request.level,
            "section": 1,
            "difficulty": ["easy", "medium", "hard"][i % 3],
            "question_text": f"Sample Question {i+1}: What is the meaning of this {section_text} item?",
            "options": [f"Option A", f"Option B", f"Option C", f"Option D"],
            "correct_answer_index": i % 4,
            "explanation": f"This is a sample explanation for question {i+1}",
            "tags": [request.section, request.level.lower()]
        })
    return stub_questions

@router.post("/ai/save-generated-set")
def save_generated_set(request: schemas.SaveGeneratedSetRequest, teacher: models.User = Depends(require_teacher_role), db: Session = Depends(get_db)):
    """Save a generated question set as a mock test"""
    # Create the MockTest
    db_test = models.MockTest(
        title=request.title,
        level=request.level,
        duration=request.duration
    )
    db.add(db_test)
    db.flush()
    
    # Add questions
    for q in request.questions:
        db_q = models.Question(
            test_id=db_test.id,
            section=q.section,
            number=q.options.index(max(q.options)) if hasattr(q, 'options') else 1,
            type=q.type,
            question_text=q.question_text,
            options=q.options,
            correct_index=q.correct_answer_index,
            audio_url=getattr(q, 'audio_url', None)
        )
        db.add(db_q)
    
    db.commit()
    db.refresh(db_test)
    return {"id": db_test.id, "title": db_test.title, "message": "Generated set saved successfully"}

# --- Listening Audio Generation ---

@router.post("/listening/generate-audio")
def generate_listening_audio(request: schemas.ListeningAudioGenerateRequest, teacher: models.User = Depends(require_teacher_role), db: Session = Depends(get_db)):
    """Generate listening audio from Japanese script and comprehension questions"""
    from gtts import gTTS
    import json
    import os
    from anthropic import Anthropic
    
    # Generate audio file
    try:
        tts = gTTS(text=request.script, lang='ja', slow=request.speech_speed == 'slow')
        audio_path = f"/static/audio/generated_{os.urandom(8).hex()}.mp3"
        full_path = f"backend{audio_path}"
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        tts.save(full_path)
    except Exception as e:
        print(f"Error generating audio: {e}")
        audio_path = "/static/audio/sample.mp3"
    
    # Generate comprehension questions
    questions = []
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    
    if api_key and request.generate_questions:
        try:
            client = Anthropic()
            prompt = f"""Based on this Japanese listening script, generate exactly {request.question_count} comprehension questions at {request.level} level.

Script: {request.script}

Format: JSON array with {{question_text (in English), options: [4 options in English], correct_answer_index, difficulty, explanation}}

Return ONLY valid JSON array."""

            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            content = response.content[0].text
            if content.startswith('```'):
                content = content.split('```')[1]
                if content.startswith('json'):
                    content = content[4:]
                content = content.split('```')[0]
            
            questions = json.loads(content.strip())
        except Exception as e:
            print(f"Error generating questions: {e}")
            questions = []
    
    # Fallback questions
    if not questions:
        questions = [
            {
                "question_text": "What is the main topic of this listening passage?",
                "options": ["Topic A", "Topic B", "Topic C", "Topic D"],
                "correct_answer_index": 0,
                "difficulty": "easy",
                "explanation": "This is a sample comprehension question"
            }
        ]
    
    return {
        "audio_url": audio_path,
        "metadata": {
            "voice_style": request.voice_style,
            "speech_speed": request.speech_speed,
            "speaker_count": request.speaker_count
        },
        "questions": questions
    }

# --- Templates Management ---

@router.post("/templates", response_model=schemas.AITemplateResponse)
def create_template(template: schemas.AITemplateCreate, teacher: models.User = Depends(require_teacher_role), db: Session = Depends(get_db)):
    """Create an AI question template"""
    db_template = models.AITemplate(
        name=template.name,
        level=template.level,
        section=template.section,
        description=template.description,
        questions=[q.dict() for q in template.questions]
    )
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

@router.get("/templates", response_model=List[schemas.AITemplateResponse])
def list_templates(teacher: models.User = Depends(require_teacher_role), db: Session = Depends(get_db)):
    """List all saved question templates"""
    return db.query(models.AITemplate).all()

@router.delete("/templates/{template_id}")
def delete_template(template_id: int, teacher: models.User = Depends(require_teacher_role), db: Session = Depends(get_db)):
    """Delete a saved template"""
    db_template = db.query(models.AITemplate).filter(models.AITemplate.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(db_template)
    db.commit()
    return {"message": "Template deleted successfully"}

# --- Module Settings ---

@router.get("/settings", response_model=dict)
def get_settings(teacher: models.User = Depends(require_teacher_role), db: Session = Depends(get_db)):
    """Get module settings (toggles for features)"""
    settings = db.query(models.ModuleSettings).first()
    if not settings:
        # Create default settings
        settings = models.ModuleSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    return {
        "id": settings.id,
        "module_toggles": {
            "ai_generator_enabled": settings.ai_generator_enabled,
            "listening_generator_enabled": settings.listening_generator_enabled,
            "template_save_enabled": settings.template_save_enabled,
            "question_bank_enabled": settings.question_bank_enabled
        }
    }

@router.put("/settings")
def update_settings(request: schemas.ModuleSettingsUpdate, teacher: models.User = Depends(require_teacher_role), db: Session = Depends(get_db)):
    """Update module settings"""
    settings = db.query(models.ModuleSettings).first()
    if not settings:
        settings = models.ModuleSettings()
        db.add(settings)
    
    for key, value in request.module_toggles.items():
        if hasattr(settings, key):
            setattr(settings, key, value)
    
    db.commit()
    db.refresh(settings)
    return {"message": "Settings updated successfully"}

# --- Level Configuration ---

@router.get("/levels")
def get_levels(teacher: models.User = Depends(require_teacher_role), db: Session = Depends(get_db)):
    """Get level configurations"""
    levels = db.query(models.LevelConfiguration).all()
    if not levels:
        # Initialize default levels
        default_levels = [
            ("N5", 110, 100, 60),
            ("N4", 110, 100, 60),
            ("N3", 140, 120, 65),
            ("N2", 155, 140, 70),
            ("N1", 170, 150, 70)
        ]
        for level, duration, questions, pass_score in default_levels:
            db.add(models.LevelConfiguration(
                level=level,
                duration=duration,
                questions=questions,
                pass_score=pass_score
            ))
        db.commit()
        levels = db.query(models.LevelConfiguration).all()
    
    return {"levels": [{"level": l.level, "duration": l.duration, "questions": l.questions, "pass_score": l.pass_score} for l in levels]}

@router.put("/levels")
def update_levels(levels: List[schemas.LevelConfigUpdate], teacher: models.User = Depends(require_teacher_role), db: Session = Depends(get_db)):
    """Update level configurations"""
    for level_update in levels:
        db_level = db.query(models.LevelConfiguration).filter(models.LevelConfiguration.level == level_update.level).first()
        if db_level:
            db_level.duration = level_update.duration
            db_level.questions = level_update.questions
            db_level.pass_score = level_update.pass_score
    
    db.commit()
    levels = db.query(models.LevelConfiguration).all()
    return {"levels": [{"level": l.level, "duration": l.duration, "questions": l.questions, "pass_score": l.pass_score} for l in levels]}
