from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# 優先讀取環境變數 DATABASE_URL，否則使用預設值（Docker Compose 內部連線）
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://iven:7aciYMUu@igb_postgres:5432/igb_db"
)

# 建立 SQLAlchemy 引擎
engine = create_engine(DATABASE_URL)

# 建立 SessionLocal
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base 供模型繼承
Base = declarative_base()

# 取得資料庫連線（可在 FastAPI 依賴注入中使用）
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
