# app/modules/project_service.py

from sqlalchemy.orm import Session
from app.models import Project
from typing import List

# 1. 定義 Pydantic 輸出模型 (Schema)
from pydantic import BaseModel, ConfigDict

# 這是 API 輸出的資料格式，確保數據一致性
class ProjectSchema(BaseModel):
    # 允許直接從 SQLAlchemy ORM 模型讀取數據
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    status: str
    # 這裡可以選擇性加入 created_at, updated_at

# 2. Service 層的業務邏輯
def get_projects(db: Session, skip: int = 0, limit: int = 100) -> List[Project]:
    """
    從資料庫中獲取專案列表。Service 層負責與 DB 模型交互。
    """
    # 使用 SQLAlchemy 查詢資料庫
    return db.query(Project).offset(skip).limit(limit).all()
