from fastapi import APIRouter, HTTPException, Body, status
from typing import List, Optional, Dict

# 從 db/inventory.py 導入資料模型和資料庫模擬
from db.inventory import Module, modules_db, next_id

# 創建 APIRouter 實例
router = APIRouter(
    prefix="/modules",
    tags=["採購模組管理"],
    responses={404: {"description": "找不到該資源"}},
)

# 為了讓 next_id 能夠在路由函數中被修改 (例如新增時)，我們需要將其作為一個列表或字典來傳遞，
# 但由於我們在這裡模擬資料庫，我們將使用 global 關鍵字。
# 更好的做法是在大型應用程式中使用依賴注入 (DI) 或一個類別來管理狀態。

# 確保我們能正確地操作這個 next_id
class DatabaseState:
    """用來模擬資料庫狀態的容器，確保 next_id 可以在不同函數間共享和修改。"""
    next_id: int = next_id

db_state = DatabaseState()

def find_module_index(module_id: int) -> int:
    """根據 ID 查找模組在列表中的索引。"""
    for i, module in enumerate(modules_db):
        if module.id == module_id:
            return i
    return -1

# 1. 取得所有模組 (GET /modules/)
@router.get(
    "/",
    response_model=List[Module],
    summary="取得所有模組的清單",
    description="回傳目前庫存中所有電子零件或數碼模組的完整清單。",
)
def get_all_modules():
    """
    回傳所有模組的清單。
    """
    return modules_db

# 2. 新增一個模組 (POST /modules/)
@router.post(
    "/",
    response_model=Module,
    status_code=status.HTTP_201_CREATED,
    summary="新增一個採購模組",
    description="在庫存中新增一個新的模組記錄。",
)
def create_module(module: Module = Body(
        ...,
        example={
            "name": "NVIDIA GeForce RTX 4080",
            "price": 1200.00,
            "quantity": 50,
            "manufacturer": "NVIDIA"
        }
    )):
    """
    創建一個新的模組並給予唯一的 ID。

    - **name**: 模組名稱
    - **price**: 單價 (必須 > 0)
    - **quantity**: 庫存數量 (必須 > 0)
    - **manufacturer**: 製造商 (可選)
    """

    # 設置新的 ID
    module.id = db_state.next_id
    db_state.next_id += 1

    # 將模組加入資料庫模擬列表
    modules_db.append(module)

    return module

# 3. 取得特定 ID 的模組 (GET /modules/{module_id})
@router.get(
    "/{module_id}",
    response_model=Module,
    summary="依 ID 取得特定模組",
    description="根據模組的唯一 ID 取得其詳細資訊。",
)
def get_module_by_id(module_id: int):
    """
    根據 ID 取得單一模組。
    如果找不到該 ID，則返回 404 錯誤。
    """

    for module in modules_db:
        if module.id == module_id:
            return module

    # 如果找不到，拋出 404 錯誤
    raise HTTPException(status_code=404, detail=f"找不到 ID 為 {module_id} 的模組")

# 4. 更新特定 ID 的模組 (PUT /modules/{module_id})
@router.put(
    "/{module_id}",
    response_model=Module,
    summary="更新特定 ID 的模組",
    description="根據模組的唯一 ID 更新其所有資訊。",
)
def update_module(module_id: int, module_update: Module = Body(
        ...,
        example={
            "name": "Intel Core i7-14700K",
            "price": 385.00,
            "quantity": 95,
            "manufacturer": "Intel"
        }
    )):
    """
    根據 ID 更新模組的資訊。

    - **module_id**: 要更新的模組 ID
    - **module_update**: 包含所有更新欄位的 Pydantic 模型
    """

    # 查找模組的索引
    index = find_module_index(module_id)

    if index == -1:
        # 如果找不到，拋出 404 錯誤
        raise HTTPException(status_code=404, detail=f"找不到 ID 為 {module_id} 的模組")

    # 確保更新後的模組仍然擁有相同的 ID
    module_update.id = module_id

    # 替換舊的模組資料
    modules_db[index] = module_update

    return module_update

# 5. 刪除特定 ID 的模組 (DELETE /modules/{module_id})
@router.delete(
    "/{module_id}",
    summary="刪除特定 ID 的模組",
    description="根據模組的唯一 ID 從庫存中移除該模組。",
    status_code=status.HTTP_204_NO_CONTENT, # 刪除成功通常返回 204 No Content
)
def delete_module(module_id: int):
    """
    根據 ID 刪除單一模組。
    """

    # 查找模組的索引
    index = find_module_index(module_id)

    if index == -1:
        # 即使找不到，我們也可以返回 204，因為結果是該模組已不存在。
        # 但為了明確性，我們也可以拋出 404。這裡選擇拋出 404 讓使用者知道 ID 不存在。
        raise HTTPException(status_code=404, detail=f"找不到 ID 為 {module_id} 的模組")

    # 刪除模組
    del modules_db[index]

    # 返回一個空的字典和 204 狀態碼
    return {"ok": True}
