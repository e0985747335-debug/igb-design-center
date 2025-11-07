#!/bin/bash
# ==========================================================
# 🕒 Auto Cron Backup v3.0
# 作者：IGB Tung
# 功能：
#   ✅ 每週自動備份目前 crontab 設定
#   ✅ 備份檔案命名格式：crontab_backup_YYYYMMDD_HHMMSS.txt
#   ✅ 自動刪除超過 30 天的舊備份
#   ✅ 桌面通知：備份成功 / 失敗
# ==========================================================

BACKUP_DIR="$HOME"
DATE=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="$BACKUP_DIR/crontab_backup_${DATE}.txt"
LOG_FILE="$BACKUP_DIR/cron_backup.log"

echo "[$DATE] 🧭 開始自動備份 cron 任務..." | tee -a "$LOG_FILE"

# 1️⃣ 備份目前 crontab 設定
crontab -l > "$BACKUP_FILE" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "[$DATE] ✅ 備份完成：$BACKUP_FILE" | tee -a "$LOG_FILE"
    notify-send "✅ Cron 備份成功" "已備份至：${BACKUP_FILE}" -i dialog-information
else
    echo "[$DATE] ⚠️ 尚未設定 crontab 或備份失敗。" | tee -a "$LOG_FILE"
    notify-send "⚠️ Cron 備份失敗" "請確認 crontab 是否存在或權限正常。" -i dialog-warning
fi

# 2️⃣ 清除超過 30 天的舊備份
DELETED=$(find "$BACKUP_DIR" -name "crontab_backup_*.txt" -type f -mtime +30 -print -delete)
if [ -n "$DELETED" ]; then
    echo "[$DATE] 🧹 已清除以下舊備份：" | tee -a "$LOG_FILE"
    echo "$DELETED" | tee -a "$LOG_FILE"
else
    echo "[$DATE] 🧩 沒有舊備份需要刪除。" | tee -a "$LOG_FILE"
fi

echo "[$DATE] ✅ 自動備份流程結束。" | tee -a "$LOG_FILE"
echo "----------------------------------------" | tee -a "$LOG_FILE"
