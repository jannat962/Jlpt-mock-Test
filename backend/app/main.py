import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine, SessionLocal
from .routers import exam, admin, auth
from .models import User, Question
from .auth_utils import hash_password

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and auto-seed
    print("[STARTUP] Initializing database...")
    try:
        models.Base.metadata.create_all(bind=engine)
        print("[STARTUP] Database tables verified.")
        auto_seed()
    except Exception as e:
        print(f"[STARTUP] Error during initialization: {e}")
    yield
    # Shutdown logic (if any) could go here

app = FastAPI(
    title="JLPT N4 Mock Test API", 
    version="1.0.0",
    lifespan=lifespan
)

def auto_seed():
    db = SessionLocal()
    try:
        # Check if user exists
        if not db.query(models.User).filter(models.User.email == "test@example.com").first():
            print("Auto-seeding: Creating test user...")
            test_user = models.User(
                name="Test User", email="test@example.com", 
                password_hash=hash_password("test123"), role="learner", readiness_score=0.0
            )
            db.add(test_user)
            db.commit()
        
        # Check if any tests exist
        if db.query(models.MockTest).count() == 0:
            print("Auto-seeding: Creating sample test...")
            sample_test = models.MockTest(
                id=1, title="Sample Mock Exam #1", level="N4", duration=120
            )
            db.add(sample_test)
            db.commit()

        # Check if any questions exist
        if db.query(models.Question).count() == 0:
            print("Auto-seeding: Creating sample questions...")
            sample_q = models.Question(
                test_id=1, section=0, number=1, type="Mondai 1",
                question_text="Kore wa ... desu.",
                options=["A", "B", "C", "D"], correct_index=0
            )
            db.add(sample_q)
            db.commit()
            print("Sample data created.")
            
    except Exception as e:
        print(f"Auto-seed failed: {e}")
    finally:
        db.close()

from fastapi.staticfiles import StaticFiles

app = FastAPI(title="JLPT N4 Mock Test API", version="1.0.0")

# Serve static audio files
static_dir = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

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
    allow_origins=origins,  # Allowed for credentials
    allow_origin_regex="https://jlpt-platform.*\.vercel\.app", # Support all Vercel previews
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

# Register routers
app.include_router(exam.router, prefix="/api/tests", tags=["Exam Engine"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin Panel"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
