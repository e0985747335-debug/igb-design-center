
# 🧩 IGB ERP / e-Market 系統架構設計文件

> 本文件屬於 IGB Design Center 內部研發資產，未經授權禁止散佈。

---

## 🏗 系統總覽

IGB ERP / e-Market 是一個整合 **企業營運核心模組**（CRM、SCM、財務、人資、BI）  
與 **技術基礎架構**（Next.js、Node.js、PostgreSQL、Redis、S3）的雲原生企業營運平台。

系統核心概念：
- **模組化架構** → 各模組皆可獨立部署與版本控管  
- **微服務整合** → API Gateway 統一對外提供 REST / GraphQL  
- **資料一致性** → 採用事件驅動（Event Sourcing + CQRS）  
- **數據中台** → 整合 Data Warehouse、BI Dashboard、ETL Pipeline

---

## ⚙️ 架構層級

| 層級 | 技術 | 功能重點 |
| :--- | :--- | :--- |
| **Frontend** | Next.js + React + Tailwind | 多租戶後台管理、報表、BI 儀表板 |
| **Backend Services** | Node.js (NestJS / Express) | 微服務應用層（CRM / SCM / Finance） |
| **Database Layer** | PostgreSQL + Prisma ORM | 核心交易與財務資料儲存 |
| **Cache / Queue** | Redis / RabbitMQ | 非同步任務、事件驅動架構 |
| **Storage** | AWS S3 / MinIO | 檔案與報表儲存 |
| **DevOps / CI-CD** | GitHub Actions + Docker + Kubernetes | 自動部署、監控與版本發佈 |
| **Analytics / BI** | Metabase / Superset | 財務與營運視覺化分析 |

---

## 🔄 核心資料流程

1. **交易事件**：  
   前端觸發訂單、付款、入庫、出貨等動作 → 傳至 `Event Bus`  
2. **傳票生成 (Finance-Service)**：  
   每筆交易自動產生會計分錄，寫入 `journal_entries` 表  
3. **Data Lake 同步**：  
   傳票與交易每日 ETL 至 Data Warehouse  
4. **BI 分析層**：  
   Metabase 產出多維損益表、節點分析、App 錢包餘額報告

---

## 🧠 關鍵模組設計

| 模組 | 關鍵功能 | 與財務整合 |
| :--- | :--- | :--- |
| **CRM** | 客戶資料、訂單、發票 | 銷貨收入 / 應收帳款 |
| **SCM** | 供應鏈、庫存、物流 | 銷貨成本 / 存貨變動 |
| **Finance** | 傳票、總帳、報表 | 科目 1xxx~8xxx 自動分錄 |
| **HRM** | 員工資料、薪資、出勤 | 人事費用 / 預提費用 |
| **BI** | Data Warehouse + Dashboard | 自動生成財務與營運報告 |

---

## 🛠 系統部署範例

```bash
# 本地開發
docker-compose up

# 雲端部署 (Kubernetes)
kubectl apply -f k8s/

# CI/CD (GitHub Actions)
.github/workflows/deploy.yml
🧾 附註
本系統採用 永續盤存制 (Perpetual Inventory)

所有交易事件均自動觸發對應會計分錄

Tech Lead 應確保模組間透過 Event Bus 保持最終一致性

© IGB Design Center — Internal Use Only.
