from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os
from sqlalchemy import create_engine

# 🔹 匯入你專案的 Base（模型的 metadata）
from app.db.base import Base  # 修改路徑以符合你的專案結構，例如 app/models/base.py 或 app/db/base.py

# 讀取 Alembic 設定
config = context.config

# 設定日誌（可省略）
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 目標 metadata（模型的定義）
target_metadata = Base.metadata

# 🔹 從環境變數讀取資料庫 URL（Docker Compose 已設定 DATABASE_URL）
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://igb_user:.///7aciYMUu@db/igb_design_center")

def run_migrations_offline():
    """以 offline 模式執行 migrations（不連線資料庫）"""
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """以 online 模式執行 migrations（連線資料庫）"""
    connectable = create_engine(DATABASE_URL, poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
