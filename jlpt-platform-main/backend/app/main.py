import os
import logging
import traceback
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine, SessionLocal
from .routers import exam, admin, auth
from .models import User, Question
from .auth_utils import hash_password

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and auto-seed
    print("[STARTUP] Initializing database...")
    retry_count = 0
    max_retries = 3
    while retry_count < max_retries:
        try:
            models.Base.metadata.create_all(bind=engine)
            print("[STARTUP] Database tables verified.")
            auto_seed()
            break
        except Exception as e:
            retry_count += 1
            print(f"[STARTUP] Initialization attempt {retry_count} failed: {e}")
            if retry_count < max_retries:
                import time
                time.sleep(2)
            else:
                print("[STARTUP] CRITICAL: Database initialization failed after multiple attempts.")
    yield

app = FastAPI(
    title="JLPT N4 Mock Test API", 
    version="1.0.0",
    lifespan=lifespan
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log the full stack trace for debugging production 500 errors
    error_msg = f"Internal Server Error: {str(exc)}"
    print(f"[ERROR] {error_msg}")
    print(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": error_msg}
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
]

# Add frontend URL from environment if provided
frontend_url = os.getenv("FRONTEND_URL", "").strip()
if frontend_url:
    origins.append(frontend_url)

# Add a more permissive check for Vercel preview branches if needed
# Note: Wildcards with allow_credentials=True are strictly regulated by browsers

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allowed for credentials
    allow_origin_regex=r"https://jlpt-platform.*\.vercel\.app", # Support all Vercel previews
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
