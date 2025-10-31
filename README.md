# 🏗 IGB Design Center

> **數位化企業核心增長系統（IGB ERP / e-Market 專案）**
> 整合營運、數據、與決策的企業級數位化平台。

本專案結合 **企業營運核心模組**（CRM、SCM、財務、人資、BI 等）與
**技術基礎架構**（Next.js、Node.js、PostgreSQL、Redis、S3 等），
旨在打造可擴展、可觀測、可維運的現代化企業營運系統。

---

## 🌟 專案特色

* **模組化架構**：CRM、SCM、財務、人資、BI 完整覆蓋企業流程
* **雲原生部署**：支援 Docker / Kubernetes / Vercel 雲端運行
* **數據驅動決策**：整合 Data Warehouse + BI Dashboard
* **DevOps 自動化**：每日報表、部署、監控全自動化
* **高擴展性前端**：Next.js + React + Chart.js + Tailwind CSS

---

## 📁 專案結構

```
e-market/
├── frontend/              # 前端應用 (Next.js)
├── docs/                  # 系統設計與技術文件
│   ├── architecture.md    # 🧩 系統架構與模組關係圖
│   └── ...
├── logs/                  # 自動化執行日誌
├── scripts/               # 自動化腳本（報表、部署等）
├── .github/               # CI/CD & Vercel 工作流
└── README.md              # 本文件
```

---

## 🧠 系統架構 (IGB ERP Layered Architecture)

```
┌─────────────────────────────┐
│ 展示層 Presentation Layer   │  → React / Next.js / API Gateway
├─────────────────────────────┤
│ 應用層 Application Layer    │  → Node.js / 微服務 / REST / GraphQL
├─────────────────────────────┤
│ 數據層 Data Layer           │  → PostgreSQL / Redis / S3 / Data Lake
└─────────────────────────────┘
```

---

## 🧩 核心模組總覽

| 模組  | 模組名稱   | 關鍵功能          |
| --- | ------ | ------------- |
| CRM | 客戶關係管理 | 客戶、銷售、報價、售後服務 |
| SCM | 供應鏈管理  | 採購、庫存、供應商協同   |
| PM  | 生產管理   | 工單、排程、車間監控    |
| FA  | 財務會計   | 應收應付、總帳、成本、稅務 |
| HCM | 人力資本管理 | 員工、薪資、考勤、績效   |
| BI  | 商業智能   | 即時儀表板、報表、預測分析 |

---

## ⚙️ 技術棧 (Tech Stack)

| 類別     | 技術                                     |
| ------ | -------------------------------------- |
| 前端     | Next.js, React, Tailwind CSS, Chart.js |
| 後端     | Node.js, Express, NestJS (部分模組)        |
| 資料庫    | PostgreSQL, Redis, MinIO/S3            |
| 自動化    | Shell Scripts, Cron Jobs               |
| DevOps | GitHub Actions, Docker, Vercel, pm2    |
| 分析     | BigQuery / Superset / Metabase         |

---

## 🚀 自動化與部署

| 腳本                    | 功能           |
| --------------------- | ------------ |
| `daily_reminder.sh`   | 每日提醒與報告生成    |
| `weekly_report.sh`    | 每週業績摘要       |
| `monthly_report.sh`   | 每月 KPI 與財報生成 |
| `auto_push.sh`        | 自動同步代碼與日誌    |
| `status_dashboard.sh` | 系統健康檢查面板     |

---

## 📜 授權與版權

© 2025 IGB Design Center. All Rights Reserved.
本專案內容屬於內部研發文件，未經授權不得散佈或公開發佈。
