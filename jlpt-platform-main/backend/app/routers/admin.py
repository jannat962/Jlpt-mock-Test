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
