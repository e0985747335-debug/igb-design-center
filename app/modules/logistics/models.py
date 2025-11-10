from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime

# 假設 Base 從 app.core.database 被導入 (在 app/server.py 中確保了)
from app.core.database import Base 

# -------------------------------------------------------------------
# RMA 退換貨請求 (RMA Request)
# -------------------------------------------------------------------
class RMARequest(Base):
    """
    RMA 退換貨請求的主記錄。
    此記錄包含用戶的原始申請和 SiteLink 夥伴的最終裁決。
    """
    __tablename__ = "rma_requests"

    # 主鍵和基本資訊
    id = Column(Integer, primary_key=True, index=True)
    rma_number = Column(String, unique=True, index=True, nullable=False) # RMA 追蹤號碼
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 關聯欄位 (ForeignKey)
    # 假設我們將 RMA 與提交用戶 (Identity) 關聯
    requester_user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False) 
    
    # 原始請求細節 (用戶 App 提交)
    product_sku = Column(String, index=True, nullable=False)
    reason_code = Column(String, nullable=False) # 退換貨原因代碼
    is_original_packaging = Column(Boolean, default=False)
    
    # SiteLink 夥伴裁決結果 (Tech Lead 考題中設計的數據)
    partner_decision_code = Column(String, default="PENDING") # ACCEPT/REJECT/PENDING
    partner_user_id = Column(Integer, nullable=True) # 最終裁決的夥伴 ID
    verification_gps = Column(String, nullable=True) # 裁決時的 GPS 座標
    inventory_disposal_code = Column(String, nullable=True) # 庫存處理代碼 (WASTE, RE-SELL)


# -------------------------------------------------------------------
# SiteLink 巡檢任務 (Patrol Mission)
# -------------------------------------------------------------------
class PatrolMission(Base):
    """
    SiteLink 夥伴的巡檢任務記錄，用於追蹤工作效率。
    """
    __tablename__ = "patrol_missions"

    id = Column(Integer, primary_key=True, index=True)
    patrol_id = Column(String, unique=True, index=True, nullable=False)
    partner_user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)

    # 狀態機追蹤 (參考 Patrol_State_Machine_Spec)
    status = Column(String, default="IDLE") # IDLE, ON_PATROL, MISSION_COMPLETE, ABORTED
    
    # 任務時間與地理資訊
    start_timestamp = Column(DateTime, nullable=True)
    start_gps = Column(String, nullable=True)
    end_timestamp = Column(DateTime, nullable=True)
    end_gps = Column(String, nullable=True)
    
    # 計算結果
    duration_ms = Column(Integer, nullable=True) # 巡檢時長 (毫秒)
    
    # 關係：一個巡檢任務可能包含多個 RMA 驗收活動
    # patrol_rmas = relationship("RMARequest", backref="patrol_record") # 示例關係
