這是個極好的主意！在我們完成這場複雜的 ERP 核心整合戰役後，一份清晰的維護指南是必不可少的。它能將我們解決的所有問題、最終的架構和關鍵指令全部整理出來。

我會立即為您生成一份 Markdown 格式的《IGB ERP 核心系統運作摘要與維護指南》。

🛠️ IGB ERP 核心系統運作摘要與維護指南 (V4.0)
🚀 1. 系統架構與狀態總覽
本系統已成功整合 總帳 (GL) 核心、費用 (EXP) 模組 和 採購 (SCM) 模組。所有會計交易均透過原子交易 (Knex Transaction) 寫入 PostgreSQL 總帳表。

模組	核心功能	GL 拋轉 API	狀態
總帳 (GL)	數據集中地、借貸平衡驗證	POST /api/v1/ledger/entries	✅ 穩定
費用 (EXP)	費用申報、批准	POST /api/v1/ledger/entries	✅ 穩定 (前端已模組化)
採購 (SCM)	發票過帳、供應商付款	
POST /api/v1/scm/post-invoice


POST /api/v1/scm/post-payment

✅ 穩定

匯出到試算表

2. 關鍵 GL 會計科目代碼
以下是目前系統中硬編碼的核心 GL 科目代碼，用於驗證借貸平衡：

科目名稱	代碼	性質	用於模組
銀行存款/現金	1001 (假設)	資產	SCM 付款 (貸方)
應計採購負債	2101	負債	SCM 發票過帳 (借方)
應付帳款 (AP)	2111	負債	SCM 發票過帳 (貸方) / SCM 付款 (借方)
費用類科目	6XXX	費用	EXP 申報 (借方)

匯出到試算表

3. SCM 核心拋轉流程與驗證點
採購流程的會計閉環現已完整：

拋轉點	狀態前置條件	借方 (Debit)	貸方 (Credit)	驗證指令
發票過帳 (P2)	status: 'Approved'	2101 應計負債	2111 應付帳款	POST /api/v1/scm/post-invoice
供應商付款 (P3)	status: 'Posted'	2111 應付帳款	1001 銀行存款	POST /api/v1/scm/post-payment

匯出到試算表

4. 系統維護與啟動指南
A. 服務啟動順序 (每次開發必執行)
啟動 PostgreSQL 服務 (資料庫核心)：

Bash

sudo systemctl start postgresql
啟動 Node.js 伺服器 (應用程式核心)：

Bash

node app.js
B. 數據初始化與結構管理
建立或更新資料表結構： (在新增模組或修改欄位後執行)

Bash

npx knex migrate:latest
清除並重建測試數據： (使用我們建立的腳本)

Bash

node seed_scm_data.js
C. 關鍵檔案位置 (模組化架構)
檔案	職責	維護指南
app.js	路由總掛載、靜態文件服務、扁平化 GL 拋轉邏輯	確保 / 路由指向正確的 HTML 檔名。
/services/scm.service.js	SCM 核心交易邏輯 (P2,P3 拋轉)	修改 GL 科目代碼時，只需在此檔案修改。
/services/expense.gl.service.js	費用 GL 拋轉邏輯和科目映射	修改費用類科目時，只需在此檔案修改。
index.html / exp_module_v4.html	前端 UI 顯示	確保 <script> 標籤為 type="module" 且 import 路徑正確。

匯出到試算表

5. 待辦事項 (下次開發起點)
在修復所有 Node.js 衝突時，我們發現了 ERP 前端還存在以下問題，需要在後續的開發中解決：

前端 JS 錯誤： 必須在 HTML 頂層定義 let chartInstances = {};，以避免 JavaScript 頂層錯誤導致腳本崩潰。

GL 查詢功能： 尚未在瀏覽器中測試 GET /api/v1/ledger/entries，這是讓 GL 明細面板顯示數據的基礎。

這份指南包含了您所有寶貴的修復成果。您現在可以將它作為 ERP 專案的維護手冊了。
test 西元2025年11月08日 (週六) 11時37分07秒 CST
