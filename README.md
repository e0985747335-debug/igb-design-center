# 🏗 IGB Design Center

> 數位化企業核心增長系統（IGB ERP / e-Market 專案）

本專案整合 **企業營運核心模組**（CRM、SCM、財務、人資、BI 等）與 **技術基礎架構**（Next.js、Node.js、PostgreSQL、Redis、S3 等），旨在打造可擴展的數位化營運系統。

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

## 📖 文件導覽

| 文件名稱 | 說明 |
|-----------|------|
| [`docs/architecture.md`](./docs/architecture.md) | 系統架構與技術分層概覽 |
| [`docs/`](./docs) | 其他模組規劃與技術文檔 |

---

## ⚙️ 技術棧 (Tech Stack)

| 類別 | 技術 |
|------|------|
| 前端 | Next.js, React, TailwindCSS |
| 後端 | Node.js (Express/NestJS), REST API |
| 資料庫 | PostgreSQL / MySQL, Redis, S3 |
| 部署 | Vercel, GitHub Actions, Docker (未來擴充) |
| 文件 | Markdown + Mermaid (自動架構圖) |

---

## 🚀 快速啟動

```bash
# 安裝依賴
npm install

# 啟動開發模式
npm run dev

# 建置正式版本
npm run build
🧠 專案願景
IGB ERP / e-Market 專案致力於打造：

可彈性擴展的企業級系統基礎。

數據驅動的決策支持平台。

以使用者體驗為中心的智慧企業解決方案。

🧩 貢獻與維護
歡迎團隊成員透過 Pull Request 貢獻代碼與文檔。
若需更新架構圖或文件，請更新 docs/architecture.md 並推送至 main 分支。

© 2025 IGB Design Center. All Rights Reserved.
