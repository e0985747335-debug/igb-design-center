#!/bin/bash
# ==========================================================
# 🧠 IGB ERP 2.0 Auto Status Guide Generator v2.3
# ==========================================================

cd ~/igb-design-center || exit
DATE=$(date '+%Y%m%d_%H%M%S')
LOG_FILE="./logs/auto-status-guide.log"
GUIDE_FILE="./AUTO_STATUS_GUIDE_v2.3.md"

mkdir -p ./logs

echo "[$DATE] 🚀 產生 AUTO_STATUS_GUIDE_v2.3.md 中..." | tee -a "$LOG_FILE"

cat > "$GUIDE_FILE" <<'EOF'
# 🧠 IGB ERP 2.0 自動化狀態摘要 (v2.3)

## 🛰 系統組件一覽
| 模組 | 功能說明 | 狀態 |
|------|-----------|------|
| `Smart Heavy Cleaner` | 自動清理暫存、快取、日誌 | ✅ 啟用 |
| `Auto Git Watcher` | 偵測檔案變化 → 自動同步 GitHub | ✅ 執行中 |
| `Auto Backup Scheduler` | 每週日 21:00 自動備份專案 | ✅ 排程啟用 |
| `Shutdown Auto-Clean` | 關機前自動清理與備份 | ✅ 監控中 |
| `AUTO_STATUS_GUIDE` | 系統摘要與狀態紀錄 | 🧩 本檔案 |

---

## 🔁 Git 版本同步檢查
```bash
git status
git fetch origin main
git diff main origin/main
