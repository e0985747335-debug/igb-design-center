# --- order_service.py ---

import httpx
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Literal
import datetime

app = FastAPI(
    title="IGB Order-Service",
    description="處理 IGB App 的所有訂單創建、結帳和狀態追蹤。"
)

# --- 服務 URL (在 K8s/Docker Compose 中應使用環境變數) ---
FINANCE_SERVICE_URL = "http://localhost:8001" # 財務服務 (main.py)
WMS_SERVICE_URL = "http://localhost:8005"     # 倉儲服務 (假設)
WALLET_SERVICE_URL = "http://localhost:8004"  # 錢包服務 (假設)

# --- 模擬訂單資料庫 ---
mock_order_db = {}

# --- 1. Pydantic 數據模型 ---

class OrderItem(BaseModel):
    """
    訂單中的單個品項 (來自 App 購物車)
    """
    sku: str
    quantity: int
    unit_price: float
    cost: float # 關鍵：商品成本 (用於 COGS)

class CheckoutRequest(BaseModel):
    """
    模型：從 IGB App 傳入的結帳請求
    """
    customer_id: str
    customer_wallet_id: str
    customer_address: str
    delivery_method: Literal["SITELINK", "STANDARD"]
    sitelink_node_id: str   # D2 維度
    sales_channel: str      # D1 維度 (例如: 'App-Neighbor')
    items: List[OrderItem]
    delivery_fee: float     # 配送費

class OrderResponse(BaseModel):
    """
    模型：立即回傳給 App 的響應
    """
    order_id: str
    status: str
    total_amount: float
    message: str

# --- 2. 服務間異步通信 (背景任務) ---

async def orchestrate_order_creation(
    order_id: str, 
    request: CheckoutRequest, 
    total_amount: float, 
    items_total: float, 
    total_cost: float
):
    """
    (異步背景任務)
    在 API 立即回應 App 之後，執行後台的服務間協同作業 (Saga 模式)。
    """
    
    # 步驟 1：(假設) 呼叫 Wallet-Service 執行扣款
    try:
        async with httpx.AsyncClient() as client:
            wallet_res = await client.post(
                f"{WALLET_SERVICE_URL}/api/v1/wallet/{request.customer_wallet_id}/withdraw", 
                json={"amount": total_amount, "reference_id": order_id},
                timeout=5.0
            )
            wallet_res.raise_for_status()
        print(f"Order-Service: Wallet {request.customer_wallet_id} 扣款 {total_amount} 成功。")
        mock_order_db[order_id]["status"] = "PAID" # 更新本地狀態為 '已付款'
        
    except httpx.RequestError as e:
        print(f"Order-Service [CRITICAL]: Wallet 扣款失敗！ 訂單 {order_id}。 錯誤: {e}")
        # 生產環境：觸發 SAGA 補償交易 (取消訂單)
        mock_order_db[order_id]["status"] = "FAILED_PAYMENT"
        return # 支付失敗，後續流程中止

    # 步驟 2：(核心任務 B) 呼叫 Finance-Service 產生「銷貨收入」傳票 (4101/2201)
    # (對應 流程 A - 觸發 7)
    finance_event = {
        "event_type": "ORDER_CONFIRMED",
        "order_id": order_id,
        "customer_wallet_id": request.customer_wallet_id,
        "items_total": items_total,
        "delivery_fee": request.delivery_fee,
        "total_amount": total_amount,
        "sitelink_node_id": request.sitelink_node_id,
        "sales_channel": request.sales_channel,
        "timestamp": datetime.datetime.now().isoformat()
    }
    try:
        async with httpx.AsyncClient() as client:
            await client.post(f"{FINANCE_SERVICE_URL}/api/v1/finance/events/order-confirmed", json=finance_event, timeout=5.0)
        print(f"Order-Service: Finance-Service (SALES) 通知成功 (Order: {order_id})。")
    except httpx.RequestError as e:
        print(f"Order-Service [WARNING]: Finance-Service (SALES) 呼叫失敗 (Order: {order_id})! {e}")
        # 生產環境：加入重試佇列 (e.g., RabbitMQ)

    # 步驟 3：呼叫 WMS-Service 觸發「揀貨」
    # (對應 流程 B - 觸發 1)
    wms_task = {
        "order_id": order_id,
        "customer_name": f"模擬客戶 {request.customer_id}",
        "customer_address": request.customer_address,
        "delivery_method": request.delivery_method,
        "sitelink_node_id": request.sitelink_node_id,
        "items": [{"sku": item.sku, "quantity": item.quantity} for item in request.items],
        "total_item_cost": total_cost # ★ 將成本傳遞給 WMS，WMS 出貨時會需要此數據
    }
    try:
        async with httpx.AsyncClient() as client:
            await client.post(f"{WMS_SERVICE_URL}/api/v1/wms/picking-tasks", json=wms_task, timeout=5.0)
        print(f"Order-Service: WMS-Service (Picking) 通知成功 (Order: {order_id})。")
        mock_order_db[order_id]["status"] = "PROCESSING" # 更新本地狀態為 '倉儲處理中'
    except httpx.RequestError as e:
        print(f"Order-Service [WARNING]: WMS-Service (Picking) 呼叫失敗 (Order: {order_id})! {e}")
        # 生產環境：加入重試佇列


# --- 3. 核心 API 端點 ---

@app.post("/api/v1/orders/checkout", response_model=OrderResponse)
async def create_order_checkout(request: CheckoutRequest, background_tasks: BackgroundTasks):
    """
    (供 IGB App 調用)
    接收客戶結帳請求，創建訂單並觸發後續流程。
    (對應 流程 A - 觸發 5)
    """
    
    # 1. 計算總金額
    items_total = sum([item.unit_price * item.quantity for item in request.items])
    total_amount = items_total + request.delivery_fee
    
    # 1b. (關鍵) 計算總成本 (用於後續 COGS 結轉)
    total_cost = sum([item.cost * item.quantity for item in request.items])
    
    # 2. 模擬生成新訂單
    new_order_id = f"ORD-{len(mock_order_db) + 1001}"
    
    mock_order_db[new_order_id] = {
        "id": new_order_id,
        "status": "PENDING_PAYMENT", # 狀態：等待付款中
        "total_amount": total_amount,
        "total_cost": total_cost, # 儲存成本以便 WMS 之後拋轉 COGS
        "customer_id": request.customer_id,
        "sitelink_node_id": request.sitelink_node_id,
        "sales_channel": request.sales_channel,
        "items": request.items
    }
    
    # 3. 觸發背景任務 (Saga)
    # 我們不讓 App 等待所有後端服務完成，而是立即回應。
    background_tasks.add_task(
        orchestrate_order_creation,
        new_order_id,
        request,
        total_amount,
        items_total,
        total_cost
    )
    
    # 4. 立即回應 App
    return OrderResponse(
        order_id=new_order_id,
        status="PENDING", # 立即回覆 "處理中"
        total_amount=total_amount,
        message="訂單已收到，正在後台處理中。"
    )

@app.get("/api/v1/orders/{order_id}")
async def get_order_status(order_id: str):
    """(供 App 調用) 查詢訂單狀態"""
    if order_id not in mock_order_db:
        raise HTTPException(status_code=404, detail="Order not found")
    return mock_order_db[order_id]

@app.get("/")
async def root():
    return {"message": "IGB Order-Service [order_service.py] 運行中。"}
