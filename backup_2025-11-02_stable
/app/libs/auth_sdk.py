# app/libs/auth_sdk.py
#
# IGB 設計研發中心 - 權限檢查 SDK
# 負責解析 HTTP Header 中的用戶 ID 和權限清單。
#
# ***修正說明 (針對 401 Unauthorized Error)***
# 修正前：直接查找 'X-User-ID'。
# 修正後：由於 FastAPI/Starlette 會將 Header 鍵標準化為全小寫，因此我們現在查找
#         全小寫的 'x-user-id' 和 'x-user-permissions' 以確保穩定性。
# *****************************************

from typing import Dict, List
from fastapi import status, HTTPException

# 常數定義，使用全小寫鍵名以匹配 FastAPI/Starlette 的 Header 處理
USER_ID_HEADER = "x-user-id"
PERMISSIONS_HEADER = "x-user-permissions"


class AuthSDK:
    """
    IGB 微服務的權限檢查 SDK。
    """

    @classmethod
    def get_user_id(cls, headers: Dict[str, str]) -> str:
        """
        從 Header 中獲取用戶 ID。
        """
        # 使用 get 函式安全地獲取 Header，並查找全小寫鍵名
        user_id_raw = headers.get(USER_ID_HEADER, "")
        
        return user_id_raw.strip()

    @classmethod
    def get_permissions(cls, headers: Dict[str, str]) -> List[str]:
        """
        從 Header 中獲取權限清單。
        """
        # 使用 get 函式安全地獲取 Header
        permissions_raw = headers.get(PERMISSIONS_HEADER, "")
        
        if not permissions_raw:
            return []

        # 解析逗號分隔的權限清單，並去除空格
        return [p.strip() for p in permissions_raw.split(',') if p.strip()]

    @classmethod
    def ensure_permission(cls, headers: Dict[str, str], required_permission: str):
        """
        檢查用戶是否具有所需的權限。
        如果檢查失敗，將拋出 HTTPException (401 或 403)。
        """
        
        user_id = cls.get_user_id(headers)
        
        # 1. 檢查用戶 ID 是否存在 (401 Unauthorized)
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="未提供 X-User-ID，無法驗證身份"
            )

        # 2. 檢查權限清單
        user_permissions = cls.get_permissions(headers)

        if required_permission not in user_permissions:
            # 權限不足 (403 Forbidden)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"權限不足：用戶 {user_id} 缺少所需權限 '{required_permission}'"
            )

        # 3. 檢查通過，返回 True (但實際上不需要返回，只需不拋出異常)
        return True

