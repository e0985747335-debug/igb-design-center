# 🚀 IGB ERP 2.0 Auto Status & Git Watcher (v2.3)
自動同步監控服務說明文件

---

## 🧠 系統資訊
- **版本**：v2.3（Whitelist Edition）
- **服務名稱**：`git-autowatch.service`
- **自動偵測範圍**：
  - 只偵測下列副檔名的變動：
    ```
    .py, .sh, .md, .yml, .yaml, .html, .js, .css, .json, .sql, .ini, .conf, .service
    ```
  - 忽略 `.log`, `.tmp`, `.cache` 等暫存與記錄檔

---

## ⚙️ 同步觸發條件
1. 檔案變動符合白名單規則  
2. 與上次自動推送間隔 **>45 秒**
3. 成功自動執行：
   ```bash
   git add -A
   git commit -m "auto-sync: changes detected $(date +'%Y-%m-%d_%H:%M:%S')"
   git push origin main
🧩
