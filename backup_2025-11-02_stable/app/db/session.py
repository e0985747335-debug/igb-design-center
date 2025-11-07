# app/db/session.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

# 讀取 .env 設定
load_dotenv()

# 取得資料庫連線字串
DATABASE_URL = os.getenv("DATABASE_URL")

# 建立 SQLAlchemy engine
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# 建立 session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 建立基礎 ORM Base
Base = declarative_base()


def get_db():
    """FastAPI 依賴注入用的資料庫 Session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """初始化資料庫（建立所有表）"""
    import app.models  # 確保所有模型都被載入
    Base.metadata.create_all(bind=engine)
