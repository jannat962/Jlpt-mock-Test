from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import json
import hashlib
import time
from .. import models, schemas
from ..database import get_db

router = APIRouter()

@router.post("/start/{test_id}", response_model=schemas.TestSessionResponse)
def start_test(test_id: int, user_id: int, db: Session = Depends(get_db)):
    """Creates a new test session for a valid user."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    new_session = models.TestSession(user_id=user_id, test_id=test_id)
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.get("/test")
def test_endpoint():
    """Simple test endpoint to verify router is working."""
    return {"message": "Exam router is working!", "status": "ok"}

@router.get("/{test_id}/questions", response_model=List[schemas.QuestionResponse])
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
def generate_audio(question_id: int, db: Session = Depends(get_db)):
    """Generate AI audio for a listening question."""
    question = db.query(models.Question).filter(models.Question.id == question_id).first()
    
    # Check for "Listening" or Japanese "聴解" (Listening) strings
    is_listening = question and ("Listening" in question.type or "聴解" in question.type)
    
    if not question or not is_listening:
        raise HTTPException(status_code=404, detail="Listening question not found")

    # Simulate AI audio generation
    import time
    import hashlib
    
    # Generate a unique audio ID based on question content
    audio_content = question.question_text
    audio_id = hashlib.md5(audio_content.encode()).hexdigest()[:8]
    
    # Simulate processing time
    time.sleep(1)
    
    # Update question with generated audio URL
    audio_url = f"https://audio-api.example.com/generate/{audio_id}.mp3"
    question.audio_url = audio_url
    
    # Store audio metadata
    metadata = {
        "duration_seconds": 35,
        "language": "ja",
        "voice": "female_japanese_n4",
        "generated_at": datetime.utcnow().isoformat(),
        "transcript": audio_content[:200] + "..."
    }
    question.image_url = json.dumps(metadata)  # Store as JSON string
    
    db.commit()
    
    return {
        "question_id": question_id,
        "audio_url": audio_url,
        "metadata": metadata,
        "status": "generated"
    }

@router.post("/submit", response_model=schemas.TestResult)
def submit_test(submission: schemas.TestSubmit, db: Session = Depends(get_db)):
    """Calculates score and saves test results."""
    session = db.query(models.TestSession).filter(models.TestSession.id == submission.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Test session not found.")
        
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