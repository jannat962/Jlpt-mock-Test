from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Connect to PostgreSQL - DATABASE_URL REQUIRED
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
if not SQLALCHEMY_DATABASE_URL:
    raise ValueError(
        "CRITICAL: DATABASE_URL environment variable is not set. "
        "This is required for database connectivity."
    )

# Fix for Render/Heroku: SQLAlchemy 1.4+ requires 'postgresql://' instead of 'postgres://'
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# The Dependency Provider
def get_db():
    db = SessionLocal()
    try:
        yield db  # FastAPI injects this 'db' into your routes
    except Exception:
        # If a DB error occurs, we still want to close the connection
        db.rollback()
        raise
    finally:
        db.close()  # CRITICAL: Prevents 500 errors caused by connection leaks
