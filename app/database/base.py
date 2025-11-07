from sqlalchemy.ext.declarative import declarative_base

# Base 類別將被所有 SQLAlchemy 模型繼承。
# 它提供了將 Python 類映射到資料庫表格的功能。
# 這一步是為確保所有模型都有一個共同的基類。
Base = declarative_base() 
