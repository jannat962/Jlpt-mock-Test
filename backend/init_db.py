#!/usr/bin/env python3
"""
Database initialization script for JLPT N4 Platform.
Run this script after setting up your PostgreSQL database.
"""

from app.database import engine
from app import models

def create_tables():
    """Create all database tables."""
    print("Dropping existing tables...")
    models.Base.metadata.drop_all(bind=engine)
    print("Creating database tables...")
    models.Base.metadata.create_all(bind=engine)
    print("✅ Database initialized successfully!")

if __name__ == "__main__":
    create_tables()