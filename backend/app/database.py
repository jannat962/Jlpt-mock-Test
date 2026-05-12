from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Connect to PostgreSQL - DATABASE_URL REQUIRED
# On Render, we prioritize os.environ over local .env files
SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    # Fallback to load_dotenv only if system env is missing
    load_dotenv()
    SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError(
        "CRITICAL: DATABASE_URL environment variable is not set."
    )

# Fix for Render/Heroku: SQLAlchemy 1.4+ requires 'postgresql://' instead of 'postgres://'
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Masked logging for debugging
masked_url = SQLALCHEMY_DATABASE_URL.split('@')[-1] if '@' in SQLALCHEMY_DATABASE_URL else 'HIDDEN'
print(f"[DB] Connecting to host: {masked_url}")

# Create engine with pooling options for production stability
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,      # Verify connection before using
    pool_recycle=300,        # Recycle connections every 5 minutes
    pool_size=10,            # Standard pool size
    max_overflow=20          # Allow up to 20 extra connections
)
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
