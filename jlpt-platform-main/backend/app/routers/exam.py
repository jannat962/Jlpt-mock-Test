from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import time
import json
import os
import logging
from jose import jwt, JWTError
from .. import models, schemas
from ..database import get_db
from ..auth_utils import SECRET_KEY, ALGORITHM

logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer()

# Authentication helper function
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

@router.get("/", response_model=List[schemas.MockTestResponse])
def list_available_tests(current_user: int = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all available mock tests for learners."""
    return db.query(models.MockTest).all()

@router.post("/start/{test_id}", response_model=schemas.TestSessionResponse)
def start_test(test_id: int, current_user: int = Depends(get_current_user), db: Session = Depends(get_db)):
    """Creates a new test session for the authenticated user."""
    test = db.query(models.MockTest).filter(models.MockTest.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found.")

    new_session = models.TestSession(user_id=current_user, test_id=test_id, is_completed=False)
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.get("/test")
def test_endpoint():
    """Simple test endpoint to verify router is working."""
    return {"message": "Exam router is working!", "status": "ok"}

@router.get("/{test_id}/questions", response_model=List[schemas.QuestionLearnerResponse])
def get_questions(test_id: int, section: int = None, db: Session = Depends(get_db)):
    """Fetches questions based on Test ID and optional Section."""
    query = db.query(models.Question).filter(models.Question.test_id == test_id)
    
    if section is not None:
        query = query.filter(models.Question.section == section)
        
    questions = query.order_by(models.Question.section, models.Question.number).all()
    
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="No questions found for this test."
        )
    
    # Process questions to include audio metadata
    result = []
    for q in questions:
        question_dict = {
            "id": q.id,
            "section": q.section,
            "number": q.number,
            "type": q.type,
            "question_text": q.question_text,
            "options": q.options,
            "audio_url": q.audio_url,
            "image_url": q.image_url,
            "audio_metadata": None
        }
        
        # Parse audio metadata if available (checks if image_url is a JSON string)
        if q.image_url and q.image_url.strip().startswith('{'):
            try:
                question_dict["audio_metadata"] = json.loads(q.image_url)
            except (json.JSONDecodeError, TypeError):
                pass
        
        result.append(question_dict)
    
    return result

@router.post("/generate-audio/{question_id}")
def generate_audio(
    question_id: int, 
    request: schemas.AudioGenerate,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate AI audio from Japanese text using gTTS. Teacher authentication required."""
    
    # Only teachers/admins can generate audio
    user = db.query(models.User).filter(models.User.id == current_user).first()
    if not user or user.role != 'teacher':
        raise HTTPException(status_code=403, detail="Only teachers can generate audio content")
    
    # Validate input
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Text is required and cannot be empty")
    
    if len(request.text) > 5000:
        raise HTTPException(status_code=400, detail="Text exceeds maximum length of 5000 characters")

    # Path logic
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    audio_dir = os.path.join(base_dir, "static", "audio")
    os.makedirs(audio_dir, exist_ok=True)
    
    timestamp = int(time.time() * 1000)
    filename = f"listening_{timestamp}.mp3"
    static_path = os.path.join(audio_dir, filename)
    
    try:
        from gtts import gTTS
        
        tts = gTTS(text=request.text.strip(), lang='ja', slow=False)
        tts.save(static_path)
        
        # Validate the generated file
        if not os.path.exists(static_path):
            raise Exception("Audio file was not created")
        
        file_size = os.path.getsize(static_path)
        if file_size == 0:
            os.remove(static_path)
            raise Exception("Generated audio file is empty — gTTS returned no data")
        
        audio_url = f"/static/audio/{filename}"
        
        # Update question in DB if a real question_id is provided
        if question_id and question_id != 0:
            question = db.query(models.Question).filter(models.Question.id == question_id).first()
            if question:
                question.audio_url = audio_url
                db.commit()
                logger.info(f"Updated question {question_id} with audio: {filename}")
        
        logger.info(f"Audio generated successfully: {filename}, size: {file_size} bytes")
        return {
            "audio_url": audio_url,
            "filename": filename,
            "file_size_bytes": file_size,
            "language": "ja",
            "question_id": question_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        # Clean up failed file
        if os.path.exists(static_path):
            try:
                os.remove(static_path)
            except Exception:
                pass
        logger.error(f"Audio generation failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Audio generation failed: {str(e)}")


@router.delete("/audio/{filename}")
def delete_audio_file(
    filename: str,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an audio file. Teacher only."""
    user = db.query(models.User).filter(models.User.id == current_user).first()
    if not user or user.role != 'teacher':
        raise HTTPException(status_code=403, detail="Teacher role required")
    
    # Security: only allow simple filenames, no path traversal
    if '/' in filename or '\\' in filename or '..' in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_path = os.path.join(base_dir, "static", "audio", filename)
    
    if os.path.exists(file_path):
        os.remove(file_path)
        logger.info(f"Deleted audio file: {filename}")
        return {"message": f"Audio file '{filename}' deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="Audio file not found")

@router.post("/submit", response_model=schemas.TestResult)
def submit_test(
    submission: schemas.TestSubmit,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Calculates score and saves test results. Requires authentication."""
    session = db.query(models.TestSession).filter(models.TestSession.id == submission.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Test session not found.")
    
    # SECURITY: Verify user owns this session
    if session.user_id != current_user:
        raise HTTPException(status_code=403, detail="Cannot submit answers for another user's session")
        
    if session.is_completed:
        raise HTTPException(status_code=400, detail="Test session is already completed.")

    correct_count = 0
    total_questions = db.query(models.Question).filter(models.Question.test_id == session.test_id).count()
    
    # Track section scores
    # Section IDs: 0 (Vocabulary & Grammar), 1 (Reading Comprehension), 2 (Listening)
    section_data = {
        0: {"correct": 0, "total": 0, "name": "Vocabulary & Grammar"},
        1: {"correct": 0, "total": 0, "name": "Reading Comprehension"},
        2: {"correct": 0, "total": 0, "name": "Listening"}
    }

    # Fetch all submitted questions at once
    submitted_q_ids = [a.question_id for a in submission.answers]
    questions = db.query(models.Question).filter(models.Question.id.in_(submitted_q_ids)).all()
    question_map = {q.id: q for q in questions}

    for answer in submission.answers:
        question = question_map.get(answer.question_id)
        if question:
            is_correct = (question.correct_index == answer.selected_index)
            
            # Update section tracking
            if question.section in section_data:
                section_data[question.section]["total"] += 1
                if is_correct:
                    section_data[question.section]["correct"] += 1
            
            if is_correct:
                correct_count += 1
            
            # Save individual answers
            user_answer = models.UserAnswer(
                session_id=submission.session_id,
                question_id=answer.question_id,
                selected_index=answer.selected_index,
                is_correct=is_correct
            )
            db.add(user_answer)

    # Calculate percentage
    score_percentage = (correct_count / total_questions * 100) if total_questions > 0 else 0
    
    # Update session
    session.score = score_percentage
    session.is_completed = True
    session.end_time = datetime.utcnow()
    
    db.commit()

    return {
        "score_percentage": round(score_percentage, 1),
        "correct_answers": correct_count,
        "total_questions": total_questions,
        "section_scores": section_data
    }
