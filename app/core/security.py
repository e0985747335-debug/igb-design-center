from datetime import datetime, timedelta
from typing import Any, Union, Optional

from passlib.context import CryptContext
from jose import jwt
from fastapi import HTTPException, status, Header, Depends 
from sqlalchemy.orm import Session

# 🛠️ 修正配置導入路徑：從 app.config.config 導入 settings
from app.config.config import settings
# 導入資料庫 session 依賴項 
from app.database import get_db 
# 導入 Identity 模組的 CRUD 邏輯
from app.modules.identity import crud 
# 導入 User 模型以進行類型提示 (假設 models.py 中有 User)
from app.database.models import User as DBUser 


# 密碼雜湊的配置。
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- 密碼相關功能 ---

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    驗證純文字密碼是否與雜湊後的密碼匹配。
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    將純文字密碼雜湊化，以便安全儲存。
    """
    return pwd_context.hash(password)

# --- JWT 相關功能 ---

def create_access_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """
    創建一個 JWT 存取令牌。
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # 使用配置中的預設過期時間 (分鐘)
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    # 封裝 JWT 內容
    to_encode = {"exp": expire, "sub": str(subject)}
    
    # 創建 JWT
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt

# --- 認證邏輯 (Authentication Logic) ---

def authenticate_user(db: Session, email: str, password: str):
    """ 驗證用戶憑證 (用於 /token 路由) """
    # 依賴於 app.modules.identity.crud
    user = crud.get_user_by_email(db, email=email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


async def get_current_user(
    db: Session = Depends(get_db),
    # 讀取網關注入的用戶 ID Header (ZTNA/Gateway 模式)
    user_id_header: str | None = Header(alias=settings.GATEWAY_USER_ID_HEADER)
) -> DBUser:
    """
    [核心 ZTNA 依賴項] 從網關注入的 Header 中提取用戶 ID，並在資料庫中驗證用戶存在。
    
    FastAPI 會自動將 HTTP Header (例如 'X-User-ID') 注入到 user_id_header 變數中。
    """
    if not user_id_header:
        # 如果 Header 缺失，則認為未經網關認證
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Header 認證失敗: 缺少 ZTNA 網關注入的用戶 ID",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 我們使用 Header 內容 (預期是夥伴 Email/ID) 進行查找
    user = crud.get_user_by_email(db, email=user_id_header) 

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"用戶 (ID: {user_id_header}) 不存在。請確保網關 ID 對應的用戶已註冊。",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用戶已被停用。",
        )
    
    # 返回用戶模型實例
    return user
