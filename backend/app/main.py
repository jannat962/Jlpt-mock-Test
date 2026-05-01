import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine
from .routers import exam

# Auto-create all tables on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="JLPT N4 Mock Test API", version="1.0.0")

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
