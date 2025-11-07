# 🧭 IGB ERP 2.0 自動化狀態摘要表（v1.2）

## 🧩 系統服務狀態
| 項目 | 啟用狀態 | 說明 |
|------|------------|------|
| 🔄 git-autowatch | ✅ 啟動中 | 偵測變更並自動推送 |
| 💾 git-autoclean-shutdown | ✅ 正常（手動可觸發） | 關機前清理與備份 |
| 🧹 smart-heavy-cleaner | ✅ 定期排程 | 清理暫存、日誌與自動同步 |
| ☁️ auto-version-push | ✅ 已整合 | 每次清理後自動版本推送至 GitHub |

---

## 🕓 自動化排程（crontab）
| 排程時間 | 任務 | 檔案 |
|-----------|------|------|
| 每日 09:00 | 開工提醒 | `/home/iven/e-market/daily_reminder.sh` |
| 每日 18:00 | 收工提醒 | `/home/iven/e-market/end_of_day.sh` |
| 每週日 21:00 | 自動備份 | `~/igb-design-center/tools/auto-backup.sh` |
| 系統開機 | 自動啟動 Git 監控 | `git-autowatch.service` |

---

## 💻 關鍵命令指南
| 目的 | 指令 |
|------|------|
| 檢查 Git 監控狀態 | `sudo systemctl status git-autowatch` |
| 啟動 Git 自動監控 | `sudo systemctl start git-autowatch` |
| 開機自啟用 | `sudo systemctl enable git-autowatch` |
| 手動執行清理與推送 | `bash ~/igb-design-center/tools/smart-heavy-cleaner.sh` |
| 手動版本推送 | `bash ~/igb-design-center/tools/auto-version-push.sh` |

---

## 🧠 備註
- 所有日誌位於：`~/igb-design-center/logs/`
- 推送錯誤時會顯示在：`git-autowatch.log`
- 若 GitHub 未同步，請執行：
  ```bash
  cd ~/igb-design-center
  git add .
  git commit -m "🧭 更新 AUTO_STATUS_GUIDE v1.2"
  git push origin main
