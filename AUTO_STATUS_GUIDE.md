# 🧭 IGB ERP 2.0 自動化狀態摘要表（2025-11-07）

## 🚀 系統自動化摘要

| 類別 | 名稱 | 功能 | 狀態檢查指令 | 啟用/停用 |
|------|------|------|--------------|------------|
| 🚀 **自動 Git 偵測** | `git-autowatch.service` | 開機啟動，自動偵測專案檔案變更、執行 commit + push | `systemctl status git-autowatch.service` | 啟用：`sudo systemctl enable git-autowatch`<br>停用：`sudo systemctl disable git-autowatch` |
| 🧹 **關機自動清理與備份** | `git-autoclean-shutdown.service` | 系統關機時自動執行清理（Smart Heavy Cleaner）與安全備份、Git 推送 | `systemctl status git-autoclean-shutdown.service` | 啟用：`sudo systemctl enable git-autoclean-shutdown`<br>停用：`sudo systemctl disable git-autoclean-shutdown` |
| 🧰 **強化清理腳本** | `tools/smart-heavy-cleaner.sh` | 手動觸發完整系統清理、Git 健檢、快取清除 | `bash ~/igb-design-center/tools/smart-heavy-cleaner.sh` | — |
| 📅 **自動排程 (cron)** | 每週日 21:00 備份 | 每週日晚上自動執行專案備份到 `~/backups/` | `crontab -l` | 新增：`crontab -e`<br>刪除：`crontab -r` |
| 🧩 **Git 倉庫修復工具** | `tools/git-repair.sh` | 用於修復壞掉或衝突的 Git 結構，並強制重設遠端 | `bash ~/igb-design-center/tools/git-repair.sh` | — |

---

## ⚙️ 常用維護命令

### 🟢 啟動與停止服務
```bash
sudo systemctl start git-autowatch
sudo systemctl start git-autoclean-shutdown

sudo systemctl stop git-autowatch
sudo systemctl stop git-autoclean-shutdown
```

### 🧠 狀態檢查
```bash
systemctl status git-autowatch.service
systemctl status git-autoclean-shutdown.service
crontab -l
```

### 🧹 手動清理與備份
```bash
bash ~/igb-design-center/tools/smart-heavy-cleaner.sh
```

### ☁️ 手動 Git 推送
```bash
cd ~/igb-design-center
git add .
git commit -m "🧠 Manual sync before changes"
git push origin main
```

### 🧰 Git 修復工具
```bash
bash ~/igb-design-center/tools/git-repair.sh
```

### 🖥️ 桌面通知測試
```bash
notify-send "✅ IGB ERP 自動化通知測試" "Git Watcher 正常運作中。"
```

---

## 🧾 建議操作指南

| 場景 | 推薦動作 |
|------|-----------|
| 修改代碼、模板後 | 直接儲存，Git Watcher 自動推送 |
| 關機前 | 自動清理＋備份 |
| 手動強制備份 | 執行 `smart-heavy-cleaner.sh` |
| Git 錯誤時 | 執行 `git-repair.sh` |
| 查看紀錄 | 檢查 `~/igb-design-center/logs/` |

---
📘 **IGB ERP 2.0 自動化控制系統文件**
