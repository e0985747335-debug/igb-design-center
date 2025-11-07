from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.sql import func
from app.db.session import Base

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False, default=0.0)   # unit price (未稅)
    cost = Column(Float, nullable=False, default=0.0)    # unit cost
    stock = Column(Integer, nullable=False, default=0)
    unit = Column(String(32), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
