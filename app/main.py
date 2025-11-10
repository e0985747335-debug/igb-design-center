from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import List, Optional
import time
import os
import inspect

# 檢查當前目錄，用於 StaticFiles
# 使用 inspect 確保在任何部署環境下都能找到檔案的根目錄
BASE_DIR = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
PROJECT_ROOT = os.path.dirname(BASE_DIR) # 專案根目錄 (igb-design-center/)

app = FastAPI(
    title="IGB ERP 2.0 戰略指揮中心",
    version="0.2.0-secure",
    description="EHSN 智慧營運引擎 API 文件（部署安全版）"
)

# 🚀 【核心修正】: 服務靜態文件 (HTML, JS, CSS)
# 將整個專案根目錄掛載為 /static 路徑。
# 注意：前端 JS 檔案必須使用相對路徑調用靜態文件，例如 /static/services/expense.gl.service.js
app.mount("/static", StaticFiles(directory=PROJECT_ROOT), name="static")

# ====================================================
# 1. 資料模型 (Models)
# ====================================================

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

# ====================================================
# 2. 總帳 (GL) 模組 API
# ====================================================

# POST /api/v1/ledger/entries (GL 拋轉 - 來自 EXP/SCM)
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

# GET /api/v1/ledger/entries (GL 查詢 - 讓前端面板顯示數據)
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

# ====================================================
# 3. 採購 (SCM) 模組 API
# ====================================================

# POST /api/v1/scm/post-payment (供應商付款)
@app.post("/api/v1/scm/post-payment", status_code=201)
def post_vendor_payment(invoice_id: int):
    voucher_id = f"P{int(time.time())}"

    return JSONResponse(content={
        "message": "Vendor payment posted successfully.",
        "invoice_id": invoice_id,
        "gl_voucher_id": voucher_id
    })

# ====================================================
# 4. 根路由修正 (發送 index.html)
# ====================================================

@app.get("/")
async def serve_app():
    # 修正：使用更健壯的 os.path.join 查找根目錄下的 HTML 文件

    # 檢查 index.html (標準名稱)
    html_path = os.path.join(PROJECT_ROOT, "index.html")

    # 如果 index.html 不存在，檢查 exp_module_v4.html (您的工作名稱)
    if not os.path.exists(html_path):
        html_path = os.path.join(PROJECT_ROOT, "exp_module_v4.html")
        if not os.path.exists(html_path):
            raise HTTPException(status_code=404, detail="ERP index file not found. Please ensure index.html or exp_module_v4.html exists in the project root.")

    # 服務主 HTML
    return FileResponse(html_path, media_type="text/html")


# 其他 API (原來的 and 靜態文件服務)
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
    openapi_schema["openapi"] = "3.0.3"
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
