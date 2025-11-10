# app/database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# 載入 .env 環境變數
load_dotenv()

# 從環境變數讀取 PostgreSQL 設定
POSTGRES_USER = os.getenv("POSTGRES_USER", "igbadmin")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "7aciYMUu")
POSTGRES_DB = os.getenv("POSTGRES_DB", "igbdb")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "igb_postgres")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")

# 組合 SQLAlchemy 連線字串
DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

# 建立 SQLAlchemy 引擎
engine = create_engine(DATABASE_URL, echo=True, pool_pre_ping=True)

# 建立 SessionLocal
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 宣告 Base 類別
Base = declarative_base()


# 依照 FastAPI 的標準設計：建立依賴項
def get_db():
    """依賴注入：每個 request 都會有獨立的 DB session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
