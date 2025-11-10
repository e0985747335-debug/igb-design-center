from fastapi import APIRouter

# Identity 模組的 API 路由器實例
router = APIRouter()

# 示例路由：用於測試應用程式是否成功啟動
@router.get("/status", tags=["Status"])
async def get_identity_status():
    """ 檢查 Identity 模組的健康狀態 """
    return {"module": "Identity", "status": "Ready", "message": "Identity module loaded successfully."}

# 未來可以在此處添加 user 相關的路由，例如：
# @router.post("/register")
# async def register_user(...):
#     pass
# ...
