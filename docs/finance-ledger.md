# 📘 IGB ERP 財務 Ledger 整合規格文件  
> Finance-Service & Accounting Ledger Integration Specification  
> 適用於 IGB ERP (e-Market / Design Center 專案)

---

## 🧩 一、Finance-Service 架構概覽

**Finance-Service** 是整個 ERP 系統的「會計引擎核心」，負責：
- 接收各模組（CRM / SCM / Inventory / Wallet）的交易事件；
- 生成對應的會計傳票；
- 寫入 **General Ledger (總帳)** 與 **Subledger (明細帳)**；
- 供 BI / Reporting 模組進行報表整合。

### 技術分層
| 層級 | 關鍵組件 | 技術說明 |
|:---|:---|:---|
| API Gateway | `/api/v1/finance` | 接收交易事件與過帳請求 |
| Service Layer | Finance Microservice | 處理會計邏輯與傳票規則 |
| Database | `finance_ledger`, `finance_entry`, `finance_journal` | 實際儲存會計交易資料 |

---

## 📊 二、Ledger 資料結構 (Database Schema)

### 1️⃣ `finance_ledger`
| 欄位 | 類型 | 說明 |
|:--|:--|:--|
| `ledger_id` | UUID | 主鍵 |
| `voucher_no` | VARCHAR | 傳票號碼 |
| `account_code` | VARCHAR | 科目代碼 (對應 accounting-spec.md) |
| `account_name` | VARCHAR | 科目名稱 |
| `debit` | DECIMAL(18,2) | 借方金額 |
| `credit` | DECIMAL(18,2) | 貸方金額 |
| `dimension` | JSONB | 維度資訊 (D1~D5) |
| `txn_source` | VARCHAR | 交易來源（CRM, SCM, Wallet） |
| `created_at` | TIMESTAMP | 建立時間 |

---

### 2️⃣ `finance_journal`
| 欄位 | 類型 | 說明 |
|:--|:--|:--|
| `journal_id` | UUID | 主鍵 |
| `ledger_id` | UUID | 對應 ledger |
| `description` | TEXT | 摘要 |
| `status` | ENUM(`draft`, `posted`, `reversed`) | 傳票狀態 |
| `post_date` | DATE | 過帳日期 |

---

## ⚙️ 三、自動傳票生成邏輯

| 來源模組 | 條件 | 借方 | 貸方 |
|:---|:---|:---|:---|
| **CRM (訂單)** | 銷貨完成 | 1101 應收帳款 | 4101 銷貨收入 |
| **SCM (採購)** | 驗收完成 | 5101 銷貨成本 | 2101 應付帳款 |
| **Wallet (App 儲值)** | 使用者充值 | 1110 銀行存款 | 2201 預收貨款 |
| **Wallet (App 消費)** | 使用者付款 | 2201 預收貨款 | 4102 銷貨收入 |
| **Inventory (入庫)** | 產生庫存 | 1101 存貨 | 5101 銷貨成本 |

---

## 🧮 四、月結與報表邏輯

- **月結自動化**
  - Finance-Service 於每月 23:59 觸發 `monthly_close_job`。
  - 自動彙整：
    - 損益：以 8001 為基準，彙總至「當期損益」。
    - 資產負債：根據 1xxx / 2xxx / 3xxx 類別生成平衡表。

- **報表匯出**
  - `GET /api/v1/finance/report/trial-balance`
  - 支援格式：CSV / PDF / XLSX
  - 可依維度 (D1~D3) 篩選：區域、節點、產品線。

---

## ☁️ 五、Vercel 自動佈署解除 (安全模式)

若你希望「推送 GitHub 不再觸發自動部署」，請執行以下步驟：

### 🔹 方法 1：從 Vercel 網頁端解除
1. 登入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 進入專案 → **Settings → Git**
3. 點擊 **“Disconnect Git Repository”**
4. 確認後保存。

> ✅ 推送 main 分支將不再觸發自動部署。

### 🔹 方法 2：從本地解除綁定
在專案根目錄執行：

```bash
rm -rf .vercel
此操作只影響本機，不刪除雲端專案。
若要重新綁定，可執行：

bash
複製程式碼
vercel link
📄 文件狀態：

版本：v1.0.0 (Final)

建立者：IGB Design Center / Finance-Tech Team

更新日期：2025-10-30

授權：內部專用，未經授權禁止散佈。
