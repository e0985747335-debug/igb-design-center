from fastapi import APIRouter, Depends
from typing import List, Dict
# 確保您已經在 app/libs/auth_sdk.py 中實作了 AuthSDK
from app.libs.auth_sdk import AuthSDK

router = APIRouter()

def get_mock_project_list() -> List[Dict]:
    """
    【業務服務層】模擬從資料庫中獲取專案列表的邏輯。
    """
    return [
        {"id": 1, "name": "新世代晶片設計 (Phase II)", "status": "進行中"},
        {"id": 2, "name": "綠能中心 AIoT 整合", "status": "待審批"},
        {"id": 3, "name": "高階電源管理模組研發", "status": "已完成"},
    ]

# 專案查詢的核心 API
@router.get("/projects", response_model=List[Dict])
async def list_projects(
    # 依賴注入：獲取所有 Header，以便檢查權限
    headers: dict = Depends(lambda h: h) 
):
    """
    查詢所有可見專案列表。
    **需要權限：igb:project:read:progress**
    """
    # 1. Controller 層強制權限檢查
    # 如果使用者沒有 'igb:project:read:progress' 權限，這裡會拋出 403 Forbidden
    AuthSDK.ensure_permission(
        headers=headers,
        required_permission="igb:project:read:progress"
    )

    # 2. 返回業務數據 (目前為 Mock 數據)
    return get_mock_project_list()
