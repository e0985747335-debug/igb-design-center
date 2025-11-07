# models.py 內容 (請複製並貼上)

from sqlalchemy import Column, Integer, String, DateTime, func
from app.database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    status = Column(String(50), default="進行中", nullable=False)
    # 建立時間 (自動填充)
    created_at = Column(DateTime, default=func.now())
    # 最後更新時間 (自動填充)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
