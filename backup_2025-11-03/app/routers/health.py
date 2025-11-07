# app/routers/health.py
from fastapi import APIRouter
from sqlalchemy import text, create_engine
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv
import os

load_dotenv()

router = APIRouter(
    prefix="/health",
    tags=["Health Check"]
)

DATABASE_URL = os.getenv("DATABASE_URL")
APP_NAME = os.getenv("APP_NAME", "Unknown App")
ENVIRONMENT = os.getenv("ENVIRONMENT", "Unknown")

@router.get("/")
def health_check():
    """健康檢查 - 確認 API 與資料庫狀態"""
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            version = conn.execute(text("SELECT version();")).fetchone()[0]
            current_db = conn.execute(text("SELECT current_database();")).fetchone()[0]
            current_user = conn.execute(text("SELECT current_user;")).fetchone()[0]

        return {
            "status": "ok",
            "app": APP_NAME,
            "environment": ENVIRONMENT,
            "database": {
                "name": current_db,
                "user": current_user,
                "version": version
            }
        }

    except SQLAlchemyError as e:
        return {
            "status": "error",
            "message": str(e)
        }
