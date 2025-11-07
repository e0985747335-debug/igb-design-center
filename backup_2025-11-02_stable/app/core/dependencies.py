from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

# 導入 Core 組件
from app.core import security
from app.core.database import get_db # 導入先前定義的 get_db 依賴項

# 導入 Identity 模組 (用於 CRUD 和 Schema)
from app.modules.identity import crud, schemas
from app.modules.identity.models import User as UserModel # 導入 User Model

# --- OAuth2 配置 ---

# 設置 OAuth2PasswordBearer，它會告知 FastAPI 預期一個 Bearer token
# tokenUrl 指向我們在 app/modules/identity/router.py 中定義的登入路由。
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="identity/token")

# --- 核心依賴項 ---

def get_current_user(
    # 自動從 Header 中提取 Token，如果失敗則會引發 401
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_db)
) -> UserModel:
    """
    從 JWT Token 中解析使用者資訊，並從資料庫中獲取完整的 User 物件。
    這是受保護路由的基礎依賴項。
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # 1. 解碼 Token
        payload = security.decode_access_token(token)
        
        # 2. 提取 user_id 和 email
        user_id: int | None = payload.get("user_id")
        user_email: str | None = payload.get("sub")
        
        if user_id is None or user_email is None:
            raise credentials_exception
        
        token_data = schemas.TokenData(user_id=user_id)
        
    except Exception:
        # 捕獲所有解碼或驗證失敗 (包括 JWT Expired Signature)
        raise credentials_exception

    # 3. 從資料庫獲取使用者
    user = crud.get_user(db, user_id=token_data.user_id)
    if user is None:
        raise credentials_exception
    
    return user

def get_current_active_user(
    current_user: Annotated[UserModel, Depends(get_current_user)]
) -> UserModel:
    """
    在 get_current_user 的基礎上，額外檢查使用者是否處於啟用狀態 (is_active=True)。
    這是應用於標準受保護路由的首選依賴項。
    """
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user
