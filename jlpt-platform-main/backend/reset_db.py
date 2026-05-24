from app.database import engine, Base
from app.models import User, Question, MockTest, TestSession, UserAnswer

def reset():
    print("⚠️ WARNING: Resetting database. All data will be deleted.")
    
    # Drop all tables
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    
    # Recreate all tables
    print("Recreating tables...")
    Base.metadata.create_all(bind=engine)
    
    print("✅ Database reset successfully!")

if __name__ == "__main__":
    reset()
