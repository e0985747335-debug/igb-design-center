from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from typing import Annotated

# 導入核心依賴項
from app.core.database import get_db # 修正導入路徑
# 導入 Logistics 模組的 Schema 和 CRUD
from app.modules.logistics.schemas import PartnerRMAVerification
from app.modules.logistics.crud import verify_rma_request

# --- 關鍵依賴函數（用於身份驗證） ---

# 閘道器注入的用戶身份 (Tech Lead 考題步驟 A)
async def get_partner_id(x_user_id: Annotated[str, Header(alias="X-User-ID")]) -> str:
    """從 ZTNA 閘道器注入的 Header 中提取 SiteLink 夥伴 ID (零信任)"""
    if not x_user_id:
        # 如果沒有 ZTNA 注入的 ID，則拒絕請求
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing ZTNA Header for partner authentication. Partner ID must be injected by Gateway."
        )
    return x_user_id

# -----------------------------------------------

# 創建 APIRouter 實例 (使用 /logistics 作為模組前綴，主應用程式將它掛載到 /api/v1 下)
router = APIRouter(
    prefix="/logistics", # 這裡使用模組前綴，主應用程式在 app/main.py 中將其掛載到 /api/v1
    tags=["Logistics - RMA"]
)

@router.post(
    "/rma/verify", 
    response_model=None, # 返回一個簡單的 JSON 字典
    status_code=status.HTTP_200_OK, 
    summary="SiteLink 夥伴 RMA 實體驗收裁決", 
    description="""
    **Tech Lead 考題核心 API**: 處理 SiteLink 夥伴提交的 RMA 實體驗收裁決。
    此 API 必須嚴格執行 5 步驟核心流程 (A-E)，並確保事務的原子性和防止重複退款。
    """
)
async def verify_rma_endpoint(
    verification_data: PartnerRMAVerification,
    # 步驟 A: 身份驗證 (從 ZTNA Header 獲取夥伴 ID)
    partner_id: Annotated[str, Depends(get_partner_id)], 
    # 資料庫會話
    db: Session = Depends(get_db),
):
    """
    調用 CRUD 邏輯來執行 RMA 驗證、狀態機鎖定、Geo-fencing 檢查 (B) 
    以及後續的微服務通知模擬 (D, E)。
    """
    try:
        # CRUD 函數負責所有的業務邏輯、鎖定和異步通知模擬
        updated_rma = verify_rma_request(
            db=db,
            verification_data=verification_data,
            partner_user_id=partner_id
        )
        
        # 成功的響應，返回關鍵追溯資訊
        return {
            "message": f"RMA {updated_rma.rma_number} 裁決已成功處理。",
            "status": updated_rma.status,
            "decision": updated_rma.partner_decision_code,
            "verified_by": updated_rma.partner_user_id,
            "verified_at": updated_rma.verified_at.isoformat() if updated_rma.verified_at else None
        }
    except HTTPException as e:
        # 重新拋出 CRUD 邏輯中引發的 HTTP 異常 (例如 404, 400)
        raise e
    except Exception as e:
        # 處理任何未預期的系統錯誤
        print(f"內部系統錯誤: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred during RMA verification."
        )
