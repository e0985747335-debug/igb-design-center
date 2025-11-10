# --- main.py (Finance-Service) ---

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Literal

app = FastAPI(
    title="IGB Finance-Service",
    description="負責處理 IGB ERP 核心財務傳票自動化生成。"
)

# --- 1. 定義業務事件模型 (Pydantic) ---

class SiteLinkDeliveryEvent(BaseModel):
    """
    事件：SiteLink 配送完成 (步驟 D)
    觸發：6211 (物流費用) 和 2103 (應付帳款)
    """
    event_type: Literal["SITELINK_COMPLETED"]
    order_id: str
    sitelink_node_id: str  # D2 維度 (關鍵)
    service_fee: float       # 應支付的服務費
    timestamp: str

class RmaApprovalEvent(BaseModel):
    """
    事件：RMA 驗收核准 (RMA 步驟 3)
    觸發：2104 (應付暫收款) 結清 -> 2201 (App 錢包餘額)
    """
    event_type: Literal["RMA_APPROVED_FOR_REFUND"]
    rma_id: str
    order_id: str
    refund_amount: float
    customer_wallet_id: str # 目標錢包 ID
    timestamp: str

class RmaInventoryScrapEvent(BaseModel):
    """
    事件：RMA 驗收報廢 (RMA 步驟 3)
    觸發：7001 (盤點損益) 和 1101 (存貨)
    """
    event_type: Literal["RMA_INVENTORY_SCRAPPED"]
    rma_id: str
    order_id: str
    item_sku: str
    item_cost: float        # 報廢商品的成本
    timestamp: str

class OrderConfirmedEvent(BaseModel):
    """
    事件：App 訂單成立 (步驟 A)
    觸發：認列收入 (4101/4103) 並扣除錢包 (2201)
    """
    event_type: Literal["ORDER_CONFIRMED"]
    order_id: str
    customer_wallet_id: str
    items_total: float      # 商品總計 (COA 4101)
    delivery_fee: float     # 配送費收入 (COA 4103)
    total_amount: float     # 總金額 (items_total + delivery_fee)
    sitelink_node_id: str   # D2 維度
    sales_channel: str      # D1 維度 (例如: 'App-Neighbor' 或 'App-SiteLink')
    timestamp: str

class OrderShippedEvent(BaseModel):
    """
    事件：WMS 已出貨 (步驟 B/C)
    觸發：永續盤存制 - 結轉銷貨成本 (5101 / 1101)
    """
    event_type: Literal["ORDER_SHIPPED"]
    order_id: str
    total_item_cost: float  # 關鍵：這是商品的總成本
    sitelink_node_id: str   # D2 維度
    sales_channel: str      # D1 維度
    timestamp: str


# --- 2. 傳票標準結構 (Pydantic) ---

class JournalEntry(BaseModel):
    """
    傳票分錄的標準結構 (符合 COA 規格書)
    """
    account_code: str  # 科目代碼 (例如 6211)
    description: str     # 摘要
    debit: float
    credit: float
    dimension_d1: str | None = None # 銷售渠道 維度
    dimension_d2: str | None = None # 地域/節點 維度
    dimension_d4: str | None = None # 資產類別 維度

class VoucherResponse(BaseModel):
    """
    成功生成傳票的回應
    """
    voucher_id: str
    status: str
    entries: List[JournalEntry]

# --- 3. 傳票生成引擎 API 端點 ---

@app.post("/api/v1/finance/events/order-confirmed", response_model=VoucherResponse)
async def handle_order_confirmed(event: OrderConfirmedEvent):
    """
    監聽 Order-Service 發出的「訂單成立」事件 (步驟 A)
    生成銷貨收入傳票。
    """
    print(f"收到訂單成立 (銷貨) 事件: {event.order_id}")

    voucher_id = f"V-SALES-{event.order_id}"
    entries = [
        # 借：扣除客戶錢包餘額
        JournalEntry(
            account_code="2201", # 預收貨款 - App 錢包餘額
            description=f"訂單 {event.order_id} 錢包付款",
            debit=event.total_amount,
            credit=0.0
        ),
        # 貸：認列商品收入
        JournalEntry(
            account_code="4101", # 銷貨收入 - 鄰居直購
            description=f"訂單 {event.order_id} 商品收入",
            debit=0.0,
            credit=event.items_total,
            dimension_d1=event.sales_channel,
            dimension_d2=event.sitelink_node_id
        )
    ]

    if event.delivery_fee > 0:
        entries.append(
            JournalEntry(
                account_code="4103", # 其他營業收入 (配送費)
                description=f"訂單 {event.order_id} 配送費收入",
                debit=0.0,
                credit=event.delivery_fee,
                dimension_d1=event.sales_channel,
                dimension_d2=event.sitelink_node_id
            )
        )

    print(f"已生成銷貨收入傳票: {voucher_id}")
    return VoucherResponse(voucher_id=voucher_id, status="GENERATED", entries=entries)

@app.post("/api/v1/finance/events/order-shipped", response_model=VoucherResponse)
async def handle_order_shipped(event: OrderShippedEvent):
    """
    監聽 WMS-Service 發出的「已出貨」事件 (步驟 B/C)
    生成永續盤存制的銷貨成本傳票。
    """
    print(f"收到訂單已出貨 (COGS) 事件: {event.order_id}")

    voucher_id = f"V-COGS-{event.order_id}"
    entries = [
        # 借：認列成本
        JournalEntry(
            account_code="5101", # 銷貨成本 (COGS)
            description=f"訂單 {event.order_id} 結轉銷貨成本",
            debit=event.total_item_cost,
            credit=0.0,
            dimension_d1=event.sales_channel,
            dimension_d2=event.sitelink_node_id
        ),
        # 貸：減少庫存
        JournalEntry(
            account_code="1101", # 存貨 - 永續盤存制
            description=f"訂單 {event.order_id} 庫存出貨",
            debit=0.0,
            credit=event.total_item_cost
        )
    ]

    print(f"已生成銷貨成本傳票: {voucher_id}")
    return VoucherResponse(voucher_id=voucher_id, status="GENERATED", entries=entries)


@app.post("/api/v1/finance/events/sitelink-completed", response_model=VoucherResponse)
async def handle_sitelink_delivery(event: SiteLinkDeliveryEvent):
    """
    監聽 SiteLink-Service 發出的「配送完成」事件 (步驟 D)
    """
    print(f"收到 SiteLink 配送完成事件: {event.order_id}")

    voucher_id = f"V-FEE-{event.order_id}"
    entries = [
        JournalEntry(
            account_code="6211", # 物流費用 - SiteLink 服務費
            description=f"結算 SiteLink 節點 {event.sitelink_node_id} 配送 {event.order_id} 服務費",
            debit=event.service_fee,
            credit=0.0,
            dimension_d2=event.sitelink_node_id
        ),
        JournalEntry(
            account_code="2103", # 應付帳款 - SiteLink 結算
            description=f"應付 SiteLink 節點 {event.sitelink_node_id} 服務費",
            debit=0.0,
            credit=event.service_fee,
            dimension_d2=event.sitelink_node_id
        )
    ]

    print(f"已生成物流成本傳票: {voucher_id}")
    return VoucherResponse(voucher_id=voucher_id, status="GENERATED", entries=entries)


@app.post("/api/v1/finance/events/rma-approved", response_model=VoucherResponse)
async def handle_rma_approval(event: RmaApprovalEvent):
    """
    監聽 RMA-Service 發出的「准予退款」事件 (RMA 步驟 3)
    """
    print(f"收到 RMA 核准退款事件: {event.rma_id}")

    voucher_id = f"V-REFUND-{event.rma_id}"
    entries = [
        JournalEntry(
            account_code="2104", # 應付暫收款 - App 退款負債
            description=f"結清 RMA {event.rma_id} 暫收款",
            debit=event.refund_amount,
            credit=0.0
        ),
        JournalEntry(
            account_code="2201", # 預收貨款 - App 錢包餘額
            description=f"RMA {event.rma_id} 退款至錢包 {event.customer_wallet_id}",
            debit=0.0,
            credit=event.refund_amount
        )
    ]

    print(f"已生成退款傳票: {voucher_id}")
    return VoucherResponse(voucher_id=voucher_id, status="GENERATED", entries=entries)


# ★★★ 新增：RMA 庫存報廢端點 ★★★
@app.post("/api/v1/finance/events/rma-scrapped", response_model=VoucherResponse)
async def handle_rma_scrap(event: RmaInventoryScrapEvent):
    """
    監聽 WMS/RMA-Service 發出的「庫存報廢」事件 (RMA 步驟 3)
    """
    print(f"收到 RMA 庫存報廢事件: {event.rma_id} (SKU: {event.item_sku})")

    voucher_id = f"V-SCRAP-{event.rma_id}"
    entries = [
        # 借：認列損失
        JournalEntry(
            account_code="7001", # 營業外收入/支出 - 盤點損益
            description=f"RMA {event.rma_id} 商品報廢損失 (SKU: {event.item_sku})",
            debit=event.item_cost,
            credit=0.0
        ),
        # 貸：減少庫存
        JournalEntry(
            account_code="1101", # 存貨 - 永續盤存制
            description=f"RMA {event.rma_id} 報廢品出庫 (SKU: {event.item_sku})",
            debit=0.0,
            credit=event.item_cost
        )
    ]

    # (此處應包含寫入 PostgreSQL 資料庫的邏輯)

    print(f"已生成庫存報廢傳票: {voucher_id}")
    return VoucherResponse(voucher_id=voucher_id, status="GENERATED", entries=entries)


# --- 4. 歡迎 / 健康檢查端點 ---
@app.get("/")
async def root():
    return {"message": "IGB Finance-Service [main.py] 運行中。"}
