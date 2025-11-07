#!/bin/bash
# ==========================================================
k#!/bin/bash
# ==========================================================
# 🧹 Smart Heavy Cleaner + Git AutoWatch Integration v2.0
# IGB ERP 2.0 系統維護與自動推送整合版
# ==========================================================

LOG_DIR="/home/iven/igb-design-center/logs"
LOG_FILE="$LOG_DIR/smart-heavy-cleaner.log"
BACKUP_DIR="/home/iven/igb-design-center/backups"
DATE=$(date '+%Y%m%d_%H%M%S')

mkdir -p "$LOG_DIR" "$BACKUP_DIR"

echo "[${DATE}] 🧹 啟動 Smart Heavy Cleaner..." | tee -a "$LOG_FILE"

# === 1. 清理暫存與快取 ===
echo "[${DATE}] 🔧 清理快取與暫存資料..." | tee -a "$LOG_FILE"
sudo rm -rf /tmp/* ~/.cache/* >/dev/null 2>&1
sudo journalctl --vacuum-time=3d >/dev/null 2>&1
find /home/iven/igb-design-center -type f -name "*.pyc" -delete
find /home/iven/igb-design-center -type d -name "__pycache__" -exec rm -rf {} +

# === 2. 備份當前 Git 狀態 ===
echo "[${DATE}] 📦 建立備份..." | tee -a "$LOG_FILE"
tar -czf "$BACKUP_DIR/igb-backup-${DATE}.tar.gz" /home/iven/igb-design-center >/dev/null 2>&1

# === 3. 檢查 Git 狀態 ===
cd /home/iven/igb-design-center || exit
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "[${DATE}] ✅ Git 狀態正常。" | tee -a "$LOG_FILE"
else
    echo "[${DATE}] ⚠ Git 結構損毀，重新初始化..." | tee -a "$LOG_FILE"
    git init
    git remote add origin https://github.com/iven-tung/igb-design-center.git
fi

# === 4. 重新提交與推送 ===
echo "[${DATE}] 🧩 重新提交所有變更..." | tee -a "$LOG_FILE"
git add .
git commit -m "🧩 Smart Heavy Cleaner 自動修復提交 ${DATE}" >/dev/null 2>&1 || true
git push origin main --force >/dev/null 2>&1 && \
notify-send "🚀 Smart Heavy Cleaner 完成" "所有更新已成功推送至 GitHub" || \
notify-send "⚠️ Smart Heavy Cleaner 警告" "推送 GitHub 失敗，請檢查網路或憑證"

# === 5. 檢查 Git AutoWatch 狀態 ===
echo "[${DATE}] 🔍 檢查 Git AutoWatch 服務..." | tee -a "$LOG_FILE"
if systemctl is-active --quiet git-autowatch.service; then
    echo "[${DATE}] ✅ Git AutoWatch 正在執行。" | tee -a "$LOG_FILE"
else
    echo "[${DATE}] ⚙️ 啟動 Git AutoWatch 服務..." | tee -a "$LOG_FILE"
    sudo systemctl restart git-autowatch.service
    notify-send "💡 Git AutoWatch 已重新啟動" "自動推送功能已恢復執行"
fi

echo "[${DATE}] 🌈 Smart Heavy Cleaner + AutoWatch 全流程完成！" | tee -a "$LOG_FILE"
notify-send "🌈 Smart Heavy Cleaner" "清理與自動推送作業完成 ✅"

