# app/modules/project_controller.py
#
# IGB 設計研發中心 - 專案進度控制器
# 負責處理 /api/v1/igb/projects 路由的業務邏輯。
# 核心功能是從 AuthSDK 驗證權限後，返回專案清單。
#
# ***修正說明 (針對 Internal Server Error)***
# 修正前：路由直接使用 Header 依賴注入 (e.g., Depends(Header(convert_underscores=False)))。
# 修正後：路由改為使用 FastAPI 的 Request 物件 (request: Request)。
#   - 這樣做可以更穩健地獲取所有請求 Header (request.headers)，避免因 Header 名稱或框架解析導致的內部錯誤。
#   - 確保 AuthSDK.ensure_permission 能夠穩定地接收到完整的 Header 字典進行處理。
# *****************************************

from typing import List, Dict, Any
from fastapi import APIRouter, Request, status, HTTPException
from ..libs.auth_sdk import AuthSDK

router = APIRouter()

def get_mock_project_list() -> List[Dict[str, Any]]:
    """
    [Mock Data] 模擬從資料庫中獲取 IGB 專案清單。
    """
    return [
        {
            "id": "PROJ-1001",
            "name": "新一代 EHSN 網路架構升級",
            "status": "In Progress",
            "progress_percent": 75,
            "owner": "John Doe",
            "required_permission": "igb:project:read:progress"
        },
        {
            "id": "PROJ-1002",
            "name": "機房環境監控系統建置 (Phase II)",
            "status": "On Hold",
            "progress_percent": 30,
            "owner": "Jane Smith",
            "required_permission": "igb:project:read:progress"
        }
    ]


@router.get(
    "/projects",
    response_model=List[Dict[str, Any]],
    status_code=status.HTTP_200_OK,
    summary="獲取 IGB 專案進度清單 (需 igb:project:read:progress 權限)"
)
def get_projects(request: Request):
    """
    **功能:** 獲取 IGB 研發與設計專案清單及其最新進度。

    **權限檢查:**
    - 依賴 AuthSDK 驗證請求 Header。
    - 需要 `igb:project:read:progress` 權限。
    """
    
    # 1. 取得所有請求 Header
    headers = dict(request.headers)

    # 2. 核心安全檢查: 驗證用戶是否有權限
    # 如果權限不足，AuthSDK 會自動拋出 401 或 403 HTTPException
    AuthSDK.ensure_permission(
        headers=headers,
        required_permission="igb:project:read:progress"
    )

    # 3. 執行業務邏輯並返回結果 (此處為 Mock 數據)
    return get_mock_project_list()

