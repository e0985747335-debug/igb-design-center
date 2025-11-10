kfrom sqlalchemy.orm import Session
from typing import List, Optional

# 使用相對導入來引用同一模組內的其他檔案
from . import models, schemas 

# --- CRUD 核心功能 ---

def get_rma_request_by_id(db: Session, rma_id: int) -> Optional[models.RMARequest]:
    """
    根據 RMA 申請的 ID 獲取單條記錄。
    """
    return db.query(models.RMARequest).filter(models.RMARequest.id == rma_id).first()

def get_rma_requests_by_user(db: Session, user_id: str) -> List[models.RMARequest]:
    """
    根據申請人 ID 獲取其所有 RMA 申請歷史記錄。
    """
    return db.query(models.RMARequest).filter(models.RMARequest.applicant_user_id == user_id).all()

def create_rma_request(
    db: Session, 
    request: schemas.RMARequestCreate, 
    applicant_user_id: str
) -> models.RMARequest:
    """
    在資料庫中創建一個新的 RMA 申請記錄。
    """
    # 創建 ORM 實例，將 Schema 數據和 applicant_user_id 結合
    db_rma = models.RMARequest(
        # 將 Pydantic 數據模型轉換為 ORM 欄位
        **request.model_dump(), 
        applicant_user_id=applicant_user_id, # 注入從 Header 或 Token 獲取的用戶 ID
        # request_status 預設為 PENDING，由模型定義處理
    )
    
    # 提交到資料庫
    db.add(db_rma)
    db.commit()
    db.refresh(db_rma)
    return db_rma

