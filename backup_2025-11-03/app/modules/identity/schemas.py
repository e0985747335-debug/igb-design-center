from pydantic import BaseModel, EmailStr, Field
from typing import Optional

# 這裡假設您在 app/modules/identity/schemas.py 中定義了一些基本的 Pydantic 模型
# 我會提供一個常見的用戶模型範例，您可以根據需要調整。

class UserBase(BaseModel):
    """基本用戶屬性，用於建立和讀取操作中共享的欄位。"""
    email: EmailStr = Field(..., example="user@example.com")
    is_active: bool = True
    is_superuser: bool = False
    full_name: Optional[str] = None

class UserCreate(UserBase):
    """用於建立新用戶的屬性 (需要密碼)。"""
    password: str

class UserUpdate(UserBase):
    """用於更新現有用戶的屬性。"""
    password: Optional[str] = None

class UserInDBBase(UserBase):
    """資料庫模型中包含的額外屬性。"""
    id: int

    # Pydantic v2 設定模型元資料
    model_config = {
        "from_attributes": True  # 允許從 ORM 模型 (例如 SQLAlchemy) 實例化
    }

class User(UserInDBBase):
    """用於 API 響應的用戶模型。"""
    pass

class UserInDB(UserInDBBase):
    """用於儲存密碼雜湊的用戶模型。"""
    hashed_password: str
