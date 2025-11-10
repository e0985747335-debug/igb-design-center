from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

# 基礎類別，所有 ORM 模型都將繼承它
# 由於我們還沒有 app/database/base.py，先在這裡定義一個基礎 Base
Base = declarative_base()

class User(Base):
    """
    SQLAlchemy ORM 模型：用戶 (users) 資料表
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    
    # 電子郵件作為主要識別符，需要唯一且被索引
    email = Column(String, unique=True, index=True, nullable=False)
    
    # 雜湊後的密碼
    hashed_password = Column(String, nullable=False)
    
    full_name = Column(String, index=True)
    
    # 權限欄位
    is_active = Column(Boolean, default=True) # 用戶是否活躍 (可登入)
    is_superuser = Column(Boolean, default=False) # 是否為超級管理員
    
    # 時間戳記
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<User(email='{self.email}', full_name='{self.full_name}')>"
