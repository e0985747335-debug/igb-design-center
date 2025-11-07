from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from typing import Annotated

# 假設這些是我們已定義的文件和依賴
from app.database import get_db
from app.modules.logistics.schemas import PartnerRMAVerification
from app.modules.logistics.crud import verify_rma_request

# --- 關鍵依賴函數（用於身份和地理驗證） ---

# 1. 閘道器注入的用戶身份 (Tech Lead 考題步驟 A)
async def get_partner_id(x_user_id: Annotated[str, Header(alias="X-User-ID")]) -> str:
    """從 ZTNA 閘道器注入的 Header 中提取 SiteLink 夥伴 ID"""
    if not x_user_id:
        # 如果沒有 ZTNA 注入的 ID，則拒絕請求
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing ZTNA Header for partner authentication."
        )
    return x_user_id

# 2. 地理圍欄驗證（Tech Lead 考題步驟 B 的部分邏輯）
# 註：完整的地理圍欄驗證（查詢 P1.1 總表）應在 CRUD 層實作
async def validate_geo_input(verification_gps: str) -> str:
    """確保 GPS 數據格式正確，並可作為後續地理圍欄驗證的輸入"""
    if not verification_gps or len(verification_gps.split(',')) != 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid GPS format. Must be 'latitude,longitude'."
        )
    return verification_gps

# -----------------------------------------------

# 創建 APIRouter 實例
router = APIRouter(
    prefix="/api/v1/logistics/rma",
    tags=["Logistics - RMA"]
)

@router.post(
    "/verify",
    status_code=status.HTTP_200_OK,
    summary="SiteLink 夥伴提交 RMA 實體驗收裁決"
)
def submit_rma_verification(
    verification_data: PartnerRMAVerification,
    db: Session = Depends(get_db),
    # 注入 SiteLink 夥伴 ID (步驟 A)
    partner_id: str = Depends(get_partner_id),
    # 注入並驗證 GPS 輸入 (步驟 B 的前置驗證)
    validated_gps: str = Depends(validate_geo_input),
):
    """
    此端點處理 SiteLink 夥伴的 RMA 實體驗收裁決。
    - 強制驗證 ZTNA 夥伴身份和 GPS 格式。
    - 呼叫 CRUD 邏輯執行：地理圍欄驗證、狀態機鎖定、裁決寫入、退款和 COGS 異步觸發。
    """
    try:
        # 呼叫 CRUD 核心邏輯 (包含步驟 B, C, D, E)
        result = verify_rma_request(
            db=db,
            rma_request_id=verification_data.rma_request_id,
            partner_id=partner_id, # 來自 Header 的 ZTNA 數據
            verification_data=verification_data
        )
        
        # 返回成功訊息和裁決結果
        return {
            "message": "RMA verification successfully submitted.",
            "decision": verification_data.partner_decision_code,
            "rma_request_id": result.rma_request_id
        }

    except HTTPException as e:
        # 直接拋出 CRUD 或 Dependencies 拋出的 HTTPException
        raise e
    except Exception as e:
        # 處理任何未預期的資料庫或業務邏輯錯誤
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process RMA verification: {e}"
        )
