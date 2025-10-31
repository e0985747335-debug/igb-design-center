# 🧾 IGB ERP 永續盤存制傳票邏輯與科目對應設計  
> 模組：Inventory-Service × Finance-Service  
> 文件目的：定義永續盤存制下「庫存異動事件」與「會計傳票」的雙向對應規格。  

---

## 📘 一、設計目標

IGB ERP 採用 **永續盤存制 (Perpetual Inventory System)**，所有的庫存異動（進貨、出貨、退貨、盤點、報廢）都會**即時**生成對應的會計傳票，以確保：

* 資產科目（1101 存貨）與成本科目（5101 銷貨成本）同步更新  
* 財務報表能即時反映營運狀態  
* Finance-Service 可根據 Inventory 事件自動生成傳票，無需人工干預  

---

## ⚙️ 二、資料流總覽

[供應商入庫 / 客戶出貨 / 調撥事件]
│
▼
Inventory-Service
（產生 InventoryEvent）
│
▼
Finance-Service
（根據事件觸發傳票生成）
│
▼
Accounting Ledger (PostgreSQL)
│
▼
BI Dashboard（即時毛利與庫存分析）

yaml
複製程式碼

---

## 🧩 三、主要事件類型與傳票邏輯

| 事件代號 | 事件名稱 | 借方科目 | 貸方科目 | 備註 |
|:--|:--|:--|:--|:--|
| `PO_RECEIVE` | 進貨入庫 | 1101 存貨 | 2101 應付帳款 | 採購單驗收入庫時觸發 |
| `PO_RETURN` | 退貨給供應商 | 2101 應付帳款 | 1101 存貨 | 金額依實際退貨數量 |
| `SO_DELIVERY` | 銷貨出庫 | 5101 銷貨成本 | 1101 存貨 | 同時觸發收入傳票 (4101) |
| `SO_RETURN` | 客戶退貨入庫 | 1101 存貨 | 5101 銷貨成本 | 同步調整收入 |
| `ADJUSTMENT` | 庫存調整 | 6711 盤盈損失 | 1101 存貨 | 包含盤點、報廢等情境 |

---

## 🧮 四、技術實作規格（Inventory-Service）

**事件格式（JSON）**

```json
{
  "eventType": "SO_DELIVERY",
  "eventId": "INV-20251030-001",
  "timestamp": "2025-10-30T18:00:00+08:00",
  "warehouse": "TW-Kaohsiung-01",
  "itemId": "SKU-10023",
  "quantity": 5,
  "unitCost": 320,
  "sourceDocument": "SO-20251030-009"
}
事件觸發條件

條件	模組來源	描述
PO_RECEIVE	SCM-Service	採購單「驗收完成」狀態
SO_DELIVERY	CRM-Service	銷售訂單「出貨確認」狀態
ADJUSTMENT	WMS-Service	盤點或報廢作業完成後

💰 五、Finance-Service 傳票生成邏輯
伺服端處理步驟：

接收 InventoryEvent

根據事件類型比對對應科目模板

計算金額：amount = quantity × unitCost

寫入傳票表格：

json
複製程式碼
{
  "journalId": "JV-20251030-022",
  "eventId": "INV-20251030-001",
  "entries": [
    { "account": "5101", "debit": 1600, "credit": 0 },
    { "account": "1101", "debit": 0, "credit": 1600 }
  ],
  "status": "POSTED"
}
📊 六、BI 報表應用
即時毛利分析：自動根據 4101 收入與 5101 成本計算每筆銷售毛利

庫存價值報表：依據 1101 存貨 的最新餘額與 ItemId 匯總顯示

異常盤點報表：自動偵測 ADJUSTMENT 事件發生頻率與金額異常

🧱 七、資料表設計建議
表名	說明
inventory_event	儲存所有庫存異動事件
finance_journal	紀錄所有自動生成的傳票
ledger_balance	每科目每月的餘額彙總，用於報表與 BI

🔐 八、安全與審計
每一筆傳票都必須含有 eventId 與 sourceDocument，以供稽核追蹤

傳票異動禁止直接修改，只允許以「沖銷傳票」的方式更正

© 2025 IGB Design Center. Internal Use Only.
本文件屬於內部研發文件，未經授權不得散佈或公開發佈。
