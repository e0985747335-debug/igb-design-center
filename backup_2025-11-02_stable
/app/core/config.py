import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "IGB Design Center API"
    VERSION: str = "1.0.0"
    ENV: str = os.getenv("ENV", "development")

    # 🔹 暫時使用 SQLite，本地運行保證成功
    SQLALCHEMY_DATABASE_URL: str = "sqlite:///./data/dev.db"

# 建立全域設定實例
settings = Settings()
