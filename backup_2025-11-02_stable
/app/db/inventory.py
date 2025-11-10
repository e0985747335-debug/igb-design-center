from pydantic import BaseModel, Field
from typing import Dict, List, Optional
import uuid

# --- Pydantic 模型定義 ---

class ModuleBase(BaseModel):
    """
    所有模組共有的基本屬性 (用於 POST 和 PUT 請求的輸入驗證)。
    """
    name: str = Field(..., max_length=100, description="模組的名稱或型號。")
    category: str = Field(..., max_length=50, description="模組所屬的類別 (e.g., CPU, Memory, Sensor)。")
    description: str = Field(None, max_length=500, description="模組的簡短描述。")
    supplier: str = Field(..., max_length=100, description="供應商名稱。")
    stock_quantity: int = Field(..., ge=0, description="當前庫存數量。")
    unit_price: float = Field(..., gt=0, description="單價 (美元)。")
    is_published: bool = Field(False, description="模組是否已發布 (可供採購或使用)。") # 新增出版狀態

class ModuleUpdate(BaseModel):
    """
    用於 PATCH 請求的部分更新模型 (所有欄位都是可選的)。
    """
    name: Optional[str] = Field(None, max_length=100, description="模組的名稱或型號。")
    category: Optional[str] = Field(None, max_length=50, description="模組所屬的類別。")
    description: Optional[str] = Field(None, max_length=500, description="模組的簡短描述。")
    supplier: Optional[str] = Field(None, max_length=100, description="供應商名稱。")
    stock_quantity: Optional[int] = Field(None, ge=0, description="當前庫存數量。")
    unit_price: Optional[float] = Field(None, gt=0, description="單價 (美元)。")
    is_published: Optional[bool] = Field(None, description="模組是否已發布。") # 新增出版狀態

class Module(ModuleBase):
    """
    完整的模組模型 (包含 ID，用於 GET 和回應)。
    """
    id: uuid.UUID = Field(..., description="模組的唯一識別碼 (UUID)。")


class ModuleListResponse(BaseModel):
    """
    用於 GET /modules/ 的回應結構。
    """
    data: List[Module] = Field(..., description="模組物件的清單。")
    count: int = Field(..., description="清單中模組的總數量。")


# --- 模擬資料庫 ---

# 使用字典作為模擬資料庫，鍵是 UUID，值是 ModuleBase 的資料字典。
modules_db: Dict[uuid.UUID, Dict] = {}

# 函數：生成新的 UUID
def next_id() -> uuid.UUID:
    return uuid.uuid4()

# 函數：檢查模組是否存在
def find_module(module_id: uuid.UUID) -> Optional[Dict]:
    return modules_db.get(module_id)

# 函數：新增/儲存模組 (用於初始化和 POST)
def add_module(data: Dict) -> Dict:
    module_id = data.get("id") or next_id()
    modules_db[module_id] = data
    data["id"] = module_id
    return data

# 函數：部分更新模組 (用於 PATCH)
def patch_module(module_id: uuid.UUID, update_data: ModuleUpdate) -> Optional[Dict]:
    current_data = find_module(module_id)
    if not current_data:
        return None

    # 使用 Pydantic 模型的 .model_dump() 搭配 exclude_none=True 獲取非空值
    updates = update_data.model_dump(exclude_unset=True)

    # 合併數據 (只有在更新數據中存在的值才會被覆蓋)
    current_data.update(updates)

    # 確保返回時是完整的數據結構 (包含 ID)
    current_data["id"] = module_id
    return current_data


# 預先新增一些測試資料 (使用 add_module 函數)
add_module({
    "name": "ESP32-WROOM-32D",
    "category": "Microcontroller",
    "description": "具備 Wi-Fi 和藍牙功能的微控制器模組。",
    "supplier": "Espressif",
    "stock_quantity": 500,
    "unit_price": 2.50,
    "is_published": True
})

add_module({
    "name": "ADXL345",
    "category": "Sensor",
    "description": "三軸加速度感測器，適用於運動偵測。",
    "supplier": "Analog Devices",
    "stock_quantity": 120,
    "unit_price": 4.80,
    "is_published": False
})
