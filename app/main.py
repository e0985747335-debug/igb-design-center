from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

app = FastAPI(
    title="IGB ERP 2.0 戰略指揮中心",
    version="0.1.0",
    description="EHSN 智慧營運引擎 API 文件（HTTP 測試模式）"
)

# === API 範例 ===
@app.get("/api/db-test")
def db_test():
    return {"status": "ok"}

# === 自訂 OpenAPI 降級為 3.0.3 ===
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    # ⬇️ 強制降級版本
    openapi_schema["openapi"] = "3.0.3"
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
