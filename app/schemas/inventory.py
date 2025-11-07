from pydantic import BaseModel
from typing import Optional

# 基礎 Schema
class InventoryBase(BaseModel):
    name: str
    quantity: int
    description: Optional[str] = None

# 用於新增項目的 Schema
class InventoryCreate(InventoryBase):
    pass

# 用於更新項目的 Schema
class InventoryUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[int] = None
    description: Optional[str] = None

# 用於回傳項目的 Schema（含 ID）
class Inventory(InventoryBase):
    id: int

    class Config:
        from_attributes = True  # Pydantic v2 用法（取代 orm_mode=True）
