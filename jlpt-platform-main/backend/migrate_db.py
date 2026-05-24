from sqlalchemy import text
from app.database import engine

def migrate():
    print("🚀 Starting database migration...")
    with engine.connect() as conn:
        try:
            # Add 'role' column to users table
            print("Adding 'role' column to 'users' table...")
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'learner'"))
            conn.commit()
            print("✅ Migration successful!")
        except Exception as e:
            print(f"❌ Migration failed: {e}")

if __name__ == "__main__":
    migrate()
