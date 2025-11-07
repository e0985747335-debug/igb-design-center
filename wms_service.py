# --- wms_service.py ---

import httpx
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Literal
import datetime

app = FastAPI(
    title="IGB WMS-Service (Warehouse Management)",
    description="負責處理 IGB ERP 的揀貨、包裝、出貨以及 RMA 驗收。"
)

# --- 服務 URL ---
FINANCE_SERVICE_URL = "http://localhost:8001" # 財務服務 (main.py)
SITELINK_SERVICE_URL = "http://localhost:8003" # SiteLink 服務
RMA_SERVICE_URL = "http://localhost:8002"      # RMA 服務

# --- 1. Pydantic 數據模型 ---

class OrderItem(BaseModel):
    sku: str
    quantity: int

class NewPickingTask(BaseModel):
    """
    模型：Order-Service 傳入的新揀貨任務
    (對應 流程 B - 觸發 1)
    """
    order_id: str
    customer_name: str
    customer_address: str
    delivery_method: Literal["SITELINK", "STANDARD"] # 配送方式
    sitelink_node_id: str | None = None # D2 維度 (如果是 SiteLink)
    items: List[OrderItem]
    total_item_cost: float # 關鍵：商品總成本 (用於 COGS)

class WmsInspectionResult(BaseModel):
    """
    模型：WMS 驗收人員提交的 RMA 驗收結果
    (對應 RMA 步驟 3)
    """
    result: Literal["Approved", "Rejected"]
    notes: str # 驗收備註，例如 "商品完好" 或 "項目不符"
    scrapped: bool = False # 是否已報廢
    item_cost: float | None = None # 如果報廢，報廢的成本

class TaskStatus(BaseModel):
    status: Literal["Success", "Failed"]
    message: str

# --- 2. 服務間異步通信 (背景任務) ---

async def notify_finance_order_shipped(task: NewPickingTask):
    """
    (背景任務) 通知 Finance-Service 結轉銷貨成本 (5101 / 1101)
    (對應 流程 B - 觸發 C. 銷貨成本結轉)
    """
    event_data = {
        "event_type": "ORDER_SHIPPED",
        "order_id": task.order_id,
        "total_item_cost": task.total_item_cost,
        "sitelink_node_id": task.sitelink_node_id,
        "sales_channel": "App-Neighbor", # 簡化假設
        "timestamp": datetime.datetime.now().isoformat()
    }
    try:
        async with httpx.AsyncClient() as client:
            await client.post(f"{FINANCE_SERVICE_URL}/api/v1/finance/events/order-shipped", json=event_data, timeout=5.0)
        print(f"WMS-Service: 成功通知 Finance (COGS) (Order: {task.order_id})")
    except httpx.RequestError as e:
        print(f"WMS-Service [WARNING]: Finance-Service (COGS) 呼叫失敗 (Order: {task.order_id})! {e}")
        # 生產環境：加入重試佇列

async def notify_sitelink_new_delivery(task: NewPickingTask):
    """
    (背景任務) 通知 SiteLink-Service 創建一個新的正向配送任務
    (對應 流程 C - 觸發 9)
    """
    sitelink_task = {
        "order_id": task.order_id,
        "customer_name": task.customer_name,
        "customer_address": task.customer_address,
        "sitelink_node_id": task.sitelink_node_id,
        "requires_cold_chain": any("milk" in item.sku for item in task.items) # 模擬冷鏈檢查
    }
    try:
        async with httpx.AsyncClient() as client:
            await client.post(f"{SITELINK_SERVICE_URL}/api/v1/sitelink/tasks/delivery", json=sitelink_task, timeout=5.0)
        print(f"WMS-Service: 成功通知 SiteLink (Delivery) (Order: {task.order_id})")
    except httpx.RequestError as e:
        print(f"WMS-Service [WARNING]: SiteLink-Service (Delivery) 呼叫失敗 (Order: {task.order_id})! {e}")

async def notify_rma_inspection_complete(rma_id: str, result: WmsInspectionResult):
    """(背景任務) 通知 RMA-Service 驗收已完成"""
    try:
        async with httpx.AsyncClient() as client:
            await client.post(f"{RMA_SERVICE_URL}/api/v1/rma/{rma_id}/inspection-complete", json=result.model_dump(), timeout=5.0)
        print(f"WMS-Service: 成功通知 RMA-Service (Inspection Complete) (RMA: {rma_id})")
    except httpx.RequestError as e:
        print(f"WMS-Service [WARNING]: RMA-Service (Inspection) 呼叫失敗 (RMA: {rma_id})! {e}")

async def notify_finance_rma_scrapped(rma_id: str, order_id: str, item_cost: float):
    """(背景任務) 如果報廢，通知 Finance-Service 認列損失 (7001 / 1101)"""
    event_data = {
        "event_type": "RMA_INVENTORY_SCRAPPED",
        "rma_id": rma_id,
        "order_id": order_id,
        "item_sku": "SKU-MILK-001", # 簡化SKU
        "item_cost": item_cost,
        "timestamp": datetime.datetime.now().isoformat()
    }
    try:
        async with httpx.AsyncClient() as client:
            await client.post(f"{FINANCE_SERVICE_URL}/api/v1/finance/events/rma-scrapped", json=event_data, timeout=5.0)
        print(f"WMS-Service: 成功通知 Finance (RMA Scrap) (RMA: {rma_id})")
    except httpx.RequestError as e:
        print(f"WMS-Service [WARNING]: Finance-Service (RMA Scrap) 呼叫失敗 (RMA: {rma_id})! {e}")


# --- 3. WMS 核心 API 端點 ---

@app.post("/api/v1/wms/picking-tasks", response_model=TaskStatus)
async def create_picking_task(task: NewPickingTask, background_tasks: BackgroundTasks):
    """
    (供 Order-Service 調用)
    接收新訂單，開始揀貨流程。
    (對應 流程 B - 觸發 1)
    """
    print(f"WMS-Service: 收到揀貨任務 {task.order_id} (成本: {task.total_item_cost})。")
    
    # (模擬 WMS 內部揀貨流程... 假設揀貨員花了 10 秒鐘)
    await asyncio.sleep(10) 
    
    # 揀貨完成，觸發「出貨」協同作業
    print(f"WMS-Service: 訂單 {task.order_id} 揀貨完成，觸發後續出貨流程...")

    # 1. (背景) 通知財務：結轉銷貨成本 (永續盤存制)
    background_tasks.add_task(notify_finance_order_shipped, task)

    # 2. (背景) 根據配送方式通知物流
    if task.delivery_method == "SITELINK":
        background_tasks.add_task(notify_sitelink_new_delivery, task)
    else:
        # (此處應呼叫一般宅配 API)
        print(f"WMS-Service: 訂單 {task.order_id} 已轉交一般宅配。")

    return TaskStatus(status="Success", message=f"訂單 {task.order_id} 已揀貨並進入出貨流程。")


@app.post("/api/v1/wms/rma/{rma_id}/inspect", response_model=TaskStatus)
async def handle_rma_inspection(rma_id: str, result: WmsInspectionResult, background_tasks: BackgroundTasks):
    """
    (供 WMS 驗收人員 UI 調用)
    處理 RMA 驗收結果。
    (對應 RMA 步驟 3 - 觸發 4)
    """
    print(f"WMS-Service: 收到 RMA {rma_id} 驗收結果: {result.result}")

    # 1. (背景) 將驗收結果回傳給 RMA-Service
    background_tasks.add_task(notify_rma_inspection_complete, rma_id, result)

    # 2. (背景) 如果商品報廢，觸發財務認列損失
    if result.result == "Approved" and result.scrapped:
        if result.item_cost is None or result.item_cost <= 0:
            print(f"WMS-Service [ERROR]: RMA {rma_id} 報廢但未提供成本！無法觸發財務。")
        else:
            # (此處應從 DB 查找 order_id，此處簡化)
            mock_order_id = f"ORD-{(int(rma_id.split('-')[1]) - 1000) + 101}" 
            background_tasks.add_task(notify_finance_rma_scrapped, rma_id, mock_order_id, result.item_cost)

    return TaskStatus(status="Success", message=f"RMA {rma_id} 驗收完畢，已觸發後續結算。")


@app.get("/")
async def root():
    return {"message": "IGB WMS-Service [wms_service.py] 運行中。"}
