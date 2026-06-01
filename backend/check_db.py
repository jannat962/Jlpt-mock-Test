from sqlalchemy import inspect
from app.database import engine

def check_db():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tables in database: {tables}")
    
    for table in tables:
        columns = [c['name'] for c in inspector.get_columns(table)]
        print(f"Table '{table}' columns: {columns}")

if __name__ == "__main__":
    check_db()
