from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, Text, ForeignKey
from sqlalchemy.orm import declarative_base # <--- 已更新，從新的路徑導入 Base

# 這是 SQLAlchemy 模型定義的基礎類別
# 由於 app/server.py 導入此檔案中的 Base，我們在此定義它。
Base = declarative_base()

# --- Identity 模組模型 (User) ---
class User(Base):
    """
    資料庫中的使用者模型 (Users Table)
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    # 儲存雜湊後的密碼
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}')>"

# --- RMA 模組模型 (RMARequest) ---
class RMARequest(Base):
    """
    退換貨申請單模型 (RMA_Requests Table)
    """
    __tablename__ = "rma_requests"
    
    # 核心欄位
    id = Column(Integer, primary_key=True, index=True)
    
    # 申請資訊 (來自 schemas.py)
    applicant_user_id = Column(String(255), index=True, nullable=False, comment="申請人 ID (來自 X-User-ID Header)")
    order_id = Column(String(50), index=True, nullable=False, comment="IGB ERP 訂單 ID")
    return_reason_code = Column(String(20), nullable=False, comment="退貨/退款原因代碼")
    return_quantity = Column(Integer, nullable=False, comment="申請退貨的品項數量")
    is_original_package_intact = Column(Boolean, nullable=False, comment="原始包裝是否完整")
    notes = Column(Text, nullable=True, comment="申請人備註")
    
    # 流程狀態與時間戳
    request_status = Column(String(20), default="PENDING", nullable=False, comment="當前申請狀態 (PENDING, APPROVED, REJECTED, ...)")
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    
    # 審核/驗收資訊
    reviewer_id = Column(String(255), nullable=True, comment="審核人 ID (Admin)")
    reviewed_at = Column(DateTime, nullable=True, comment="審核時間")
    
    # 🚨 [Tech Lead 考題 II.2] RMA 與 Patrol 的關聯 (邏輯關聯/外鍵)
    # patrol_id_at_verification = Column(Integer, ForeignKey('patrols.id'), nullable=True, comment="執行此RMA驗收時的Patrol ID")
    
    def __repr__(self):
        return f"<RMARequest(id={self.id}, status='{self.request_status}', order='{self.order_id}')>"

# --- Logistics 模組模型 (Patrol) ---
class Patrol(Base):
    """
    SiteLink 夥伴巡檢記錄模型 (Patrols Table)
    
    **滿足考題 I.3 零信任追溯鏈**
    """
    __tablename__ = "patrols"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # 零信任追溯鏈 (考題 I.3)
    partner_id = Column(String(255), index=True, nullable=False, comment="執行巡檢的 SiteLink 夥伴 ID")
    
    # 狀態機與時間戳
    request_status = Column(String(20), default="ON_PATROL", nullable=False, comment="當前任務狀態 (ON_PATROL, MISSION_COMPLETE, ...)")
    start_timestamp = Column(DateTime, default=func.now(), nullable=False, comment="巡檢開始時間")
    end_timestamp = Column(DateTime, nullable=True, comment="巡檢完成時間")
    
    # 證據記錄 (不可變記錄)
    start_gps = Column(String(100), nullable=False, comment="巡檢開始時 GPS 座標")
    end_gps = Column(String(100), nullable=True, comment="巡檢完成時 GPS 座標")
    
    # 計算結果 (考題 I.2: ACID 事務計算)
    duration_ms = Column(Integer, nullable=True, comment="總巡檢時長 (毫秒)")
    
    # 🚨 [Tech Lead 考題 II.2] Patrol 與 RMA 的邏輯關聯
    # 記錄在此次巡檢中完成的 RMA 驗收數量
    rma_verification_count = Column(Integer, default=0, nullable=False, comment="在此次巡檢期間完成的 RMA 驗收數量")

    def __repr__(self):
        return f"<Patrol(id={self.id}, partner='{self.partner_id}', status='{self.request_status}')>"
