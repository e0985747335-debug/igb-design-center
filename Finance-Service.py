# --- R&D-Service.py ---

from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Literal
import httpx
import datetime

app = FastAPI(
    title="IGB R&D-Service",
    description="負責處理研發工時提報、資本化評估及月度成本結算。"
)

# --- 服務 URL ---
FINANCE_SERVICE_URL = "http://localhost:8001" # 財務服務 (main.py)

# --- 1. 數據模型 ---

# 模擬工時數據庫中的記錄結構 (從 HR/PM 系統獲取)
class RndTimeRecord(BaseModel):
    record_id: str
    employee_id: str
    hourly_rate: float
    hours_logged: float
    project_id: str
    is_capitalizable: bool # 關鍵標記：Tech Lead 確認是否符合資本化條件
    month_period: str # YYYY-MM

# 模擬傳票所需的單筆分錄結構
class JournalEntryModel(BaseModel):
    account_code: str
    amount: float
    is_debit: bool
    description: str
    dimension_d2: str | None = None # 專案維度 (D2)

# --- 2. 模擬數據源 ---
# 假設這是當月已批准的 R&D 工時報告
MOCK_APPROVED_TIME_LOGS = [
    # 資本化工時 (應記入 1550)
    RndTimeRecord(record_id="T001", employee_id="E001", hourly_rate=500, hours_logged=120, project_id="NEW-UI-ALPHA", is_capitalizable=True, month_period="2025-10"),
    RndTimeRecord(record_id="T002", employee_id="E002", hourly_rate=600, hours_logged=80, project_id="NEW-UI-ALPHA", is_capitalizable=True, month_period="2025-10"),
    # 費用化工時 (研究、概念驗證，應記入 6311)
    RndTimeRecord(record_id="T003", employee_id="E003", hourly_rate=450, hours_logged=160, project_id="NEXT-GEN-POC", is_capitalizable=False, month_period="2025-10"),
    RndTimeRecord(record_id="T004", employee_id="E001", hourly_rate=500, hours_logged=40, project_id="NEXT-GEN-POC", is_capitalizable=False, month_period="2025-10"),
]


# --- 3. 核心批次處理邏輯 (協調財務服務) ---

async def generate_rd_settlement_voucher(entries: List[JournalEntryModel], period: str) -> str:
    """
    協調 Finance-Service 產生研發成本結算的批次傳票
    """
    
    # 計算總借貸金額 (用於驗證)
    total_debit = sum(e.amount for e in entries if e.is_debit)
    total_credit = sum(e.amount for e in entries if not e.is_debit)

    if abs(total_debit - total_credit) > 0.01:
        raise HTTPException(status_code=500, detail="Generated voucher is not balanced.")

    # 構造發送給 Finance-Service 的事件結構 (假設 Finance-Service 接收批次分錄列表)
    financial_payload = {
        "event_type": "RD_MONTHLY_SETTLEMENT",
        "period": period,
        "total_amount": total_debit,
        "entries": [
            {
                "account_code": e.account_code,
                "debit": e.amount if e.is_debit else 0.0,
                "credit": e.amount if not e.is_debit else 0.0,
                "description": e.description,
                "dimension_d2": e.dimension_d2
            } for e in entries
        ]
    }
    
    # 模擬發送 HTTP 請求給 Finance-Service
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{FINANCE_SERVICE_URL}/api/v1/finance/events/rd-settlement", json=financial_payload, timeout=10.0)
            response.raise_for_status()
            return response.json().get("voucher_id", "V-RD-UNKNOWN")
    except httpx.RequestError as e:
        print(f"FATAL: Failed to communicate with Finance-Service: {e}")
        return "V-RD-FAILED"

@app.post("/api/v1/rd/batch/monthly-settlement/{month_period}", response_model=dict)
async def monthly_settlement_batch(month_period: str, background_tasks: BackgroundTasks):
    """
    每月自動批次處理 R&D 工時，生成資本化傳票。
    """
    print(f"--- 啟動 {month_period} R&D 結算批次 ---")
    
    # 1. 初始化計數器和分錄列表
    capitalized_total = 0.0
    expensed_total = 0.0
    settlement_entries: List[JournalEntryModel] = []
    
    # 2. 處理工時記錄 (從 MOCK_APPROVED_TIME_LOGS 中獲取當月記錄)
    relevant_logs = [log for log in MOCK_APPROVED_TIME_LOGS if log.month_period == month_period]

    if not relevant_logs:
        return {"status": "SUCCESS", "message": f"Period {month_period} complete. No approved R&D time logs found."}

    for log in relevant_logs:
        cost = log.hourly_rate * log.hours_logged
        
        # 貸方分錄 (CR): 應付薪資或現金 (假設此處使用簡化的暫時性負債科目)
        settlement_entries.append(JournalEntryModel(
            account_code="2110", # 假設 2110: 應付薪資 (或暫性負債/現金流出)
            amount=cost,
            is_debit=False,
            description=f"CR: 結算工時 {log.record_id} ({log.employee_id})",
            dimension_d2=log.project_id
        ))

        # 借方分錄 (DR): 區分資本化或費用化
        if log.is_capitalizable:
            # 資本化 (DR: 1550 - R&D 軟體資本化)
            settlement_entries.append(JournalEntryModel(
                account_code="1550", # 無形資產—R&D 軟體資本化
                amount=cost,
                is_debit=True,
                description=f"DR: R&D 資本化 ({log.record_id})",
                dimension_d2=log.project_id
            ))
            capitalized_total += cost
        else:
            # 費用化 (DR: 6311 - 研發費用)
            settlement_entries.append(JournalEntryModel(
                account_code="6311", # 研發費用 (當期費用)
                amount=cost,
                is_debit=True,
                description=f"DR: R&D 費用化 ({log.record_id})",
                dimension_d2=log.project_id
            ))
            expensed_total += cost
    
    # 3. 觸發 Finance-Service 產生傳票 (在背景執行)
    background_tasks.add_task(generate_rd_settlement_voucher, settlement_entries, month_period)
    
    return {
        "status": "PROCESSING",
        "message": f"R&D 結算批次成功啟動。總成本: {(capitalized_total + expensed_total):,.2f} TWD",
        "details": {
            "capitalized_cost": f"{capitalized_total:,.2f} TWD (DR: 1550)",
            "expensed_cost": f"{expensed_total:,.2f} TWD (DR: 6311)",
            "voucher_note": "Finance-Service 已在背景生成批次傳票。"
        }
    }

# --- 4. 接下來的行動方案 ---
# 我們需要 Finance-Service 配合接收這個事件。

if __name__ == "__main__":
    # 啟動 R&D 服務 (在實際環境中可能使用 uvicorn)
    import asyncio
    print("R&D Service running...")
 # --- Finance-Service.py (新增片段) ---

# 1. 確保在頂部導入必要的庫和模型
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Literal

# ... 假設您的現有 FastAPI app 實例名為 'app' ...

# --- 新增：R&D 專用的數據模型 ---

class RDEntryModel(BaseModel):
    """R&D Service 發送過來的單筆分錄結構"""
    account_code: str
    debit: float
    credit: float
    description: str
    dimension_d2: str | None = None # 專案維度 (D2)

class RDMESettlementEvent(BaseModel):
    """事件：R&D 月度結算事件"""
    event_type: Literal["RD_MONTHLY_SETTLEMENT"]
    period: str
    total_amount: float
    entries: List[RDEntryModel]


# --- 新增：R&D 月度結算傳票生成端點 (步驟 B) ---

@app.post("/api/v1/finance/events/rd-settlement", response_model=dict)
async def handle_rd_monthly_settlement(event: RDMESettlementEvent):
    """
    接收 R&D Service 傳來的結算事件，並生成 R&D 成本傳票。
    傳票內容應為：DR (1550/6311) / CR (2110)
    """
    print(f"收到 R&D 月度結算事件 ({event.period})，總額: {event.total_amount:,.2f} TWD")

    # 1. 基礎驗證
    total_debit = sum(e.debit for e in event.entries)
    total_credit = sum(e.credit for e in event.entries)

    if abs(total_debit - total_credit) > 0.01:
        raise HTTPException(status_code=400, detail="Voucher received is unbalanced.")

    # 2. 創建傳票 ID
    voucher_id = f"V-RD-{event.period}-{datetime.datetime.now().strftime('%H%M%S')}"

    capitalized_total = sum(e.debit for e in event.entries if e.account_code == "1550")
    expensed_total = sum(e.debit for e in event.entries if e.account_code == "6311")

    # 3. 模擬寫入資料庫/總帳
    # 在此處，我們將簡單地打印結果
    print(f"✔ 傳票 ID: {voucher_id} - 周期: {event.period}")
    print(f"   資本化金額 (DR 1550): {capitalized_total:,.2f}")
    print(f"   費用化金額 (DR 6311): {expensed_total:,.2f}")

    # 4. 返回成功信息
    return {
        "status": "VOUCHER_GENERATED",
        "voucher_id": voucher_id,
        "message": f"R&D 結算傳票已成功生成。"
    }   # asyncio.run(monthly_settlement_batch(month_period="2025-10")) # 模擬手動觸發結算
