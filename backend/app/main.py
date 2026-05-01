import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine, SessionLocal
from .routers import exam
from .models import User, Question

# Auto-create all tables on startup
models.Base.metadata.create_all(bind=engine)

def auto_seed():
    db = SessionLocal()
    try:
        # Check if user exists
        if not db.query(User).filter(User.id == 1).first():
            print("🌱 Auto-seeding: Creating test user...")
            test_user = User(
                id=1, name="Test User", email="test@example.com", 
                password_hash="test123", readiness_score=0.0
            )
            db.add(test_user)
            db.commit()
        
        # Check if any questions exist
        if db.query(Question).count() == 0:
            print("🌱 Auto-seeding: No questions found. Please run seed scripts manually or via CLI.")
            # Note: We don't full-seed here to keep startup fast, 
            # but having the user fixed the "Start Session" error.
            
    except Exception as e:
        print(f"⚠️ Auto-seed failed: {e}")
    finally:
        db.close()

app = FastAPI(title="JLPT N4 Mock Test API", version="1.0.0")

@app.on_event("startup")
async def startup_event():
    auto_seed()

# Configure CORS — allow localhost for dev and Vercel for production
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://jlpt-platform.vercel.app",
    "https://jlpt-platform-git-main-jannat962s-projects.vercel.app", # Example preview URL
    os.getenv("FRONTEND_URL", ""),
]

# Add a more permissive check for Vercel preview branches if needed
# Note: Wildcards with allow_credentials=True are strictly regulated by browsers

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Use predefined origins to allow credentials securely
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the JLPT N4 API"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

# Register the exam routes
app.include_router(exam.router, prefix="/api/tests", tags=["Exam Engine"])
