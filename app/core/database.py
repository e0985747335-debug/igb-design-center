import contextlib
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 從正確的位置導入 settings 實例
from app.core.config import settings

# 修正：將 .DATABASE_URL 改為 .SQLALCHEMY_DATABASE_URL 以匹配 config.py 中的定義
SQLALCHEMY_DATABASE_URL = settings.SQLALCHEMY_DATABASE_URL

# 建立 SQLAlchemy 引擎
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    # check_same_thread=False 僅用於 SQLite 資料庫。如果使用 PostgreSQL 或 MySQL, 則可移除此參數。
)

# 建立 SessionLocal 類別
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 建立基礎模型類別
Base = declarative_base()


@contextlib.contextmanager
def get_db():
    """Dependency for getting a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
