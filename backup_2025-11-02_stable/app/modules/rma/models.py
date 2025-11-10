from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
# 從中央資料庫定義處導入 Base
from app.database.base import Base 

class RMARequest(Base):
    """
    SQLAlchemy ORM 模型：RMA 申請 (rma_requests) 資料表
    繼承自中央 Base
    """
    __tablename__ = "rma_requests"

    id = Column(Integer, primary_key=True, index=True)
    
    # 關聯欄位：申請人 ID
    # 來自 ZTNA 網關注入的 X-User-ID，用於追溯
    applicant_user_id = Column(String, index=True, nullable=False)
    
    # RMA 核心數據 (來自 RMA_Interface_Spec.md)
    order_id = Column(String, index=True, nullable=False)
    return_reason_code = Column(String, nullable=False)
    return_quantity = Column(Integer, nullable=False)
    is_original_package_intact = Column(Boolean, nullable=False) 
    notes = Column(String, nullable=True)

    # 狀態與審核追溯
    # PENDING, APPROVED, REJECTED, REFUNDED
    request_status = Column(String, default="PENDING", nullable=False)
    
    reviewer_id = Column(String, nullable=True) # 審核人 ID (例如 SiteLink 夥伴)
    reviewed_at = Column(DateTime, nullable=True) # 審核時間
    
    # 時間戳記
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<RMARequest(id={self.id}, order_id='{self.order_id}', status='{self.request_status}')>"
