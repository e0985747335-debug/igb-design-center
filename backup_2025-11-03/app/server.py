# app/server.py - Main FastAPI application setup

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
import logging

# ----------------------------------------------------
# 1. 導入路由 (Routers)
# ----------------------------------------------------

# 假設在 app/modules/identity/router.py 中定義了名為 'router' 的 APIRouter 實例
from app.modules.identity.router import router as identity_router 

# 假設在 app.modules.logistics.router 中定義了名為 'router' 的 APIRouter 實例
# 如果您的結構是 app/modules/logistics/api.py，則請自行調整導入路徑
# 這裡使用一個通用的導入，以確保變數名是唯一的
from app.modules.logistics.router import router as logistics_router 

# ----------------------------------------------------
# 2. 應用程式初始化
# ----------------------------------------------------
app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    version="0.1.0",
)

# ----------------------------------------------------
# 3. 中間件配置
# ----------------------------------------------------
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# ----------------------------------------------------
# 4. 包含路由 (Include Routers)
# ----------------------------------------------------

# 健康檢查 (Health check) 端點
@app.get("/")
def read_root():
    """返回應用程式名稱，作為基本健康檢查。"""
    return {"message": settings.APP_NAME}

# Identity 路由
# 修正：直接使用 'identity_router'，不再添加 .router
app.include_router(
    identity_router,
    prefix=f"{settings.API_V1_STR}/identity",
    tags=["Identity & Users"],
)

# Logistics 路由 (修正您的錯誤行 83 附近)
# 修正：直接使用 'logistics_router'，不再添加 .router
app.include_router(
    logistics_router,
    prefix=f"{settings.API_V1_STR}/logistics",
    tags=["Logistics"],
)

# 

