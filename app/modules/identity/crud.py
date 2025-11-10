from sqlalchemy.orm import Session
from typing import Optional

# 使用相對導入來引用同一模組內的其他檔案 (models, schemas, utils)
# 這應當能解決之前的 ImportError
from . import models, schemas
# 從 utils.py 導入密碼雜湊工具
from .utils import hash_password 
from app.core.config import settings

# --- CRUD 核心功能 ---

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    """
    根據電子郵件地址查詢用戶。
    用於登入、註冊檢查和 ZTNA Header 驗證。
    """
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    """
    在資料庫中創建一個新的用戶。
    """
    # 雜湊密碼
    hashed_password = hash_password(user.password)
    
    # 創建 ORM 實例
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        is_superuser=user.is_superuser
    )
    
    # 提交到資料庫
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- 應用程式啟動初始化邏輯 (被 app/main.py 呼叫) ---

def create_initial_superuser(db: Session, username: str, password: str) -> Optional[models.User]:
    """
    檢查資料庫中是否存在超級管理員。如果不存在，則使用 .env 中的憑證創建一個。
    """
    # 檢查是否已存在任何超級用戶
    superuser_count = db.query(models.User).filter(models.User.is_superuser == True).count()
    
    if superuser_count > 0:
        print(f"超級用戶已存在 ({superuser_count} 位)，跳過初始化。")
        return None
        
    # 檢查預設電子郵件是否已被佔用
    existing_user = get_user_by_email(db, email=username)
    if existing_user:
        if not existing_user.is_superuser:
            existing_user.is_superuser = True
            db.commit()
            print(f"用戶 {username} 已存在，升級為超級管理員。")
            return existing_user
        
        print(f"預設超級管理員 {username} 已存在，跳過創建。")
        return existing_user

    # 創建新的超級用戶
    user_in = schemas.UserCreate(
        email=username, 
        password=password, 
        full_name="System Superuser", 
        is_superuser=True
    )
    
    db_user = create_user(db=db, user=user_in)
    print(f"成功創建預設超級管理員: {username}")
    return db_user
