# app/db/test_connection.py
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv
import os

# 載入 .env 檔案
load_dotenv()

APP_NAME = os.getenv("APP_NAME", "Unknown App")
ENVIRONMENT = os.getenv("ENVIRONMENT", "Unknown")
DATABASE_URL = os.getenv("DATABASE_URL")

def test_connection():
    print("🚀 Connecting to PostgreSQL...\n")

    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            version = conn.execute(text("SELECT version();")).fetchone()[0]
            current_db = conn.execute(text("SELECT current_database();")).fetchone()[0]
            current_user = conn.execute(text("SELECT current_user;")).fetchone()[0]

            print("✅ Connection Successful!")
            print(f"📦 App: {APP_NAME}")
            print(f"🌱 Environment: {ENVIRONMENT}")
            print(f"🗃️ Database: {current_db}")
            print(f"👤 User: {current_user}")
            print(f"🧩 PostgreSQL Version: {version}")

    except SQLAlchemyError as e:
        print("❌ Connection Failed!")
        print(f"Error: {e}")

if __name__ == "__main__":
    test_connection()
