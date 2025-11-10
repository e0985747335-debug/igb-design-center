from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List

# 🛠️ 最終修復：將絕對導入 (app.modules.rma.schemas) 
# 改為最穩定的相對導入，以避免 Uvicorn 進程的環境路徑問題。
from .schemas import RMARequestResponse, RMARequestCreate

# 相對導入 CRUD 函式
from . import crud 

# 核心依賴：從 app.server.py 獲取 Session 函式
# 由於 Uvicorn 是從 app.main:app 啟動的，這裡必須使用絕對路徑
from app.server import get_db

# --- 路由實例化 ---

router = APIRouter()

# --- 核心路由 ---

@router.post(
    "/create",
    response_model=RMARequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="提交新的 RMA 申請"
)
def create_new_rma(
    request: RMARequestCreate,
    db: Session = Depends(get_db)
    # ⚠️ 注意：身份驗證和 X-User-ID 注入尚未實作。
    # 暫時使用固定的 placeholder ID
):
    """
    允許客戶（或 App 用戶）提交一個新的退換貨 (RMA) 申請。
    
    **流程:**
    1. 從 Gateway Header 獲取申請人 ID (這裡使用 Placeholder)。
    2. 使用 CRUD 函式將申請記錄寫入資料庫。
    
    **回傳:**
    新創建的 RMA 申請物件，包含 ID、狀態和時間戳。
    """
    # 🚨 Placeholder：在身份驗證模組完成之前，暫時使用固定 ID
    user_id_placeholder = "user-test-ivan-001"
    
    # 執行 CRUD 創建操作
    db_rma = crud.create_rma_request(db, request, user_id_placeholder)
    
    return db_rma

@router.get(
    "/history/{user_id}",
    response_model=List[RMARequestResponse],
    summary="獲取用戶的 RMA 歷史記錄"
)
def get_user_rma_history(user_id: str, db: Session = Depends(get_db)):
    """
    根據用戶 ID 獲取其所有的 RMA 申請記錄清單。
    """
    rma_requests = crud.get_rma_requests_by_user(db, user_id=user_id)
    if not rma_requests:
        # 如果找不到記錄，仍然返回 200 OK 和空列表
        return []
    return rma_requests

@router.get(
    "/{rma_id}",
    response_model=RMARequestResponse,
    summary="根據 ID 獲取單個 RMA 申請詳情"
)
def get_rma_details(rma_id: int, db: Session = Depends(get_db)):
    """
    根據 RMA 申請的唯一 ID 獲取其詳細資訊。
    """
    db_rma = crud.get_rma_request_by_id(db, rma_id=rma_id)
    if db_rma is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="RMA 申請 ID 不存在"
        )
    return db_rma
