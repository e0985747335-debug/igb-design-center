# 🏗 IGB Design Center

> **數位化企業核心增長系統（IGB ERP / e-Market 專案）**  
> 整合營運、數據、與決策的企業級數位化平台。

本專案結合 **企業營運核心模組**（CRM、SCM、財務、人資、BI 等）與  
**技術基礎架構**（Next.js、Node.js、PostgreSQL、Redis、S3 等），  
旨在打造可擴展、可觀測、可維運的現代化企業營運系統。

---

## 🌟 專案特色

- **模組化架構**：CRM、SCM、財務、人資、BI 完整覆蓋企業流程  
- **雲原生部署**：支援 Docker / Kubernetes / Vercel 雲端運行  
- **數據驅動決策**：整合 Data Warehouse + BI Dashboard  
- **DevOps 自動化**：每日報表、部署、監控全自動化  
- **高擴展性前端**：Next.js + React + Chart.js + Tailwind CSS  

---

## 📁 專案結構

e-market/
├── frontend/ # 前端應用 (Next.js)
├── docs/ # 系統設計與技術文件
│ ├── architecture.md # 🧩 系統架構與模組關係圖
│ └── ...
├── logs/ # 自動化執行日誌
├── scripts/ # 自動化腳本（報表、部署等）
├── .github/ # CI/CD & Vercel 工作流
└── README.md # 本文件

yaml
複製程式碼

---

## 📘 技術白皮書與開發者指引

本系統的技術文件與設計原則請參考：

- [`docs/architecture.md`](./docs/architecture.md)：系統架構與模組設計概覽  
- [`frontend/`](./frontend/)：Next.js 前端應用程式  
- [`scripts/`](./scripts/)：自動化與 DevOps 腳本  
- [`logs/`](./logs/)：自動排程與執行紀錄  

> 📄 **技術白皮書 (Technical Whitepaper)**  
> IGB Design Center 將持續更新技術白皮書內容，涵蓋：  
> - 系統整體技術藍圖  
> - 模組整合策略（CRM / SCM / BI / HRM / Finance）  
> - 雲原生與可觀測性實踐  
> - 數據治理與資訊安全策略  

---

## 🚀 未來模組開發規劃

| 模組代號 | 模組名稱 | 開發狀態 | 說明 |
|-----------|------------|-------------|------|
| `CRM-X` | 客戶關係管理擴充模組 | ⏳ 設計中 | 將導入 AI 客戶分群與行為預測 |
| `SCM-2.0` | 供應鏈智能排程系統 | 🧩 開發中 | 整合庫存預測與自動補貨演算法 |
| `FIN-AI` | 智能財務分析模組 | 🧠 構想中 | 利用 LLM + BI 進行異常偵測與報表生成 |
| `HRM-CLOUD` | 雲端人資模組 | 🚧 開發中 | 提供出勤、薪資、與績效一體化管理 |
| `BI-DATALAKE` | Data Lake + BI 數據湖 | 🧱 初始建置 | 打通各模組資料流，統一數據模型 |

---

© 2025 IGB Design Center. All Rights Reserved.  
本專案內容屬於內部研發文件，未經授權不得散佈或公開發佈。
