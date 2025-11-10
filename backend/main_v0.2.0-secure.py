# ==========================================================
# 🧠 IGB ERP 2.0 Strategic Command Center
# backend/main_v0.2.0-secure.py
# ----------------------------------------------------------
# ✅ 改進內容：
# - 強化 StaticFiles 掛載（不暴露整個專案）
# - 智慧尋找 index.html / exp_module_v4.html
# - 保留 OpenAPI 3.0.3 降級
# - 安全預設路徑（支援 systemd / Caddy / Docker）
# ==========================================================

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse, FileResponse
from fastapi.openapi.utils import get_openapi
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import time
import os

# ==========================================================
# 🔧 環境設定
# ==========================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

app = FastAPI(
    title="IGB ERP 2.0 戰略指揮中心",
    version="0.2.0-secure",
    description="EHSN 智慧營運引擎 API 文件（部署安全版）"
)

# ==========================================================
# 🌐 靜態資源服務
# ==========================================================
static_path = os.path.join(PROJECT_ROOT, "static")
if os.path.exists(static_path):
    app.mount("/static", StaticFiles(directory=static_path), name="static")
else:
    print(f"[⚠️ Warning] Static directory not found at: {static_path}")

# ==========================================================
# 📦 模型定義
# ==========================================================
class JournalEntryPart(BaseModel):
    account: str
    description: str
    debit: float = 0.0
    credit: float = 0.0

class JournalPostRequest(BaseModel):
    source_module: str
    source_doc_type: str
    source_doc_id: str
    transaction_date: str
    entries: List[JournalEntryPart]

# ==========================================================
# 📊 總帳模組 GL
# ==========================================================
@app.post("/api/v1/ledger/entries", status_code=201)
def post_journal_entries(request_data: JournalPostRequest):
    total_debit = sum(e.debit for e in request_data.entries)
    total_credit = sum(e.credit for e in request_data.entries)

    if abs(total_debit - total_credit) > 0.01:
        raise HTTPException(status_code=400, detail="Journal entries are out of balance.")

    voucher_id = f"J{int(time.time())}"
    return JSONResponse(content={
        "message": "Journal entries posted successfully.",
        "voucher_id": voucher_id,
        "post_timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z")
    })


@app.get("/api/v1/ledger/entries")
def get_ledger_entries(
    date_from: Optional[str] = Query(None),
    account: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1)
):
    mock_entries = [
        {"date": "2025-10-25", "voucher": "J002", "description": "費用申報 EXP-1001 核准：差旅", "account": "差旅費用", "debit": 1500.00, "credit": 0.00},
        {"date": "2025-10-25", "voucher": "J002", "description": "費用申報 EXP-1001 核准：差旅", "account": "應付費用", "debit": 0.00, "credit": 1500.00},
        {"date": "2025-11-07", "voucher": "J4395AB", "description": "發票轉AP: Vendor Invoice VINV-9988-A", "account": "2101", "debit": 5000.00, "credit": 0.00},
        {"date": "2025-11-07", "voucher": "J4395AB", "description": "Vendor Invoice VINV-9988-A 待支付", "account": "2111", "debit": 0.00, "credit": 5000.00},
    ]
    return {
        "metadata": {
            "page": page,
            "per_page": per_page,
            "total_entries": len(mock_entries),
            "total_debit": 6500.00,
            "total_credit": 6500.00,
            "is_balanced": True
        },
        "entries": mock_entries
    }

# ==========================================================
# 💰 SCM 模組 - 拋轉付款
# ==========================================================
@app.post("/api/v1/scm/post-payment", status_code=201)
def post_vendor_payment(invoice_id: int):
    voucher_id = f"P{int(time.time())}"
    return JSONResponse(content={
        "message": "Vendor payment posted successfully.",
        "invoice_id": invoice_id,
        "gl_voucher_id": voucher_id
    })

# ==========================================================
# 🏠 根路由（index.html）
# ==========================================================
@app.get("/")
async def serve_app():
    candidates = [
        os.path.join(PROJECT_ROOT, "index.html"),
        os.path.join(PROJECT_ROOT, "exp_module_v4.html")
    ]
    for path in candidates:
        if os.path.exists(path):
            return FileResponse(path, media_type="text/html")

    raise HTTPException(status_code=404, detail="ERP index file not found in project root.")

# ==========================================================
# 🧪 健康檢查與測試 API
# ==========================================================
@app.get("/api/db-test")
def db_test():
    return {"status": "ok"}

# ==========================================================
# 🧩 OpenAPI 降級為 3.0.3
# ==========================================================
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    openapi_schema["openapi"] = "3.0.3"
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
