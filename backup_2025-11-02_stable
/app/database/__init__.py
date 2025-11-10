# 這是 app.database 套件的初始化檔案。

# 導入所有關鍵組件，讓其他模組可以直接從 app.database 導入它們。
# 例如：from app.database import Base, get_db, SessionLocal

from .base import Base
from .session import get_db, SessionLocal, engine 

# 這裡也應該導入您的所有模型，以便它們註冊到 Base 的 Metadata 中。
# 雖然目前還不知道您的所有模型，但這是一個常見的做法。
# 假設您有 app/database/models.py
# from . import models
