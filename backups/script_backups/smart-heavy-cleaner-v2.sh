#!/bin/bash
# ==========================================================
# 🧹 Smart Heavy Cleaner v2.0 for IGB ERP 2.0
# Author: IGB DevOps
# Updated: 2025-11-08
# ==========================================================

PROJECT_DIR="/home/iven/igb-design-center"
BACKUP_BASE="/home/iven/igb-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_BASE}/backup_${TIMESTAMP}"
LOG_FILE="${PROJECT_DIR}/tools/smart-heavy-cleaner-v2.log"
TELEGRAM_BOT_TOKEN="YOUR_TELEGRAM_BOT_TOKEN"
TELEGRAM_CHAT_ID="YOUR_CHAT_ID"

echo "[$(date +"%F %T")] 🚀 Smart Heavy Cleaner v2.0 啟動中..." | tee -a "$LOG_FILE"

# ==========================================================
# 1️⃣ 壓縮過大 log 檔案
# ==========================================================
echo "[$(date +"%F %T")] 🧩 壓縮超過 50MB 的 log 檔..." | tee -a "$LOG_FILE"
find "$PROJECT_DIR/tools" -type f -name "*.log" -size +50M -exec gzip -9 {} \; 2>>"$LOG_FILE"

# ==========================================================
# 2️⃣ 清理 .git 中舊的大檔紀錄
# ==========================================================
if [ -d "$PROJECT_DIR/.git" ]; then
  echo "[$(date +"%F %T")] 🪣 清理 Git 歷史..." | tee -a "$LOG_FILE"
  pip install git-filter-repo >/dev/null 2>&1
  cd "$PROJECT_DIR"
  git filter-repo --path tools/autowatch-service.log --invert-paths --force >>"$LOG_FILE" 2>&1
fi

# ==========================================================
# 3️⃣ 建立增量備份
# ==========================================================
echo "[$(date +"%F %T")] 📦 建立增量備份於 $BACKUP_DIR ..." | tee -a "$LOG_FILE"
mkdir -p "$BACKUP_DIR"
rsync -a --delete --link-dest="${BACKUP_BASE}/latest" "$PROJECT_DIR/" "$BACKUP_DIR/" >>"$LOG_FILE" 2>&1
ln -sfn "$BACKUP_DIR" "${BACKUP_BASE}/latest"

# ==========================================================
# 4️⃣ 產生備份體積報告
# ==========================================================
du -sh "${BACKUP_BASE}/backup_"* > "${PROJECT_DIR}/tools/backup-size-report.log"
TOTAL_SIZE=$(du -sh "$BACKUP_BASE" | awk '{print $1}')

# ==========================================================
# 5️⃣ Telegram 通知
# ==========================================================
MESSAGE="🧹 Smart Heavy Cleaner v2.0 完成！
📦 備份位置: ${BACKUP_DIR}
💾 備份總容量: ${TOTAL_SIZE}
🕒 時間: $(date +"%F %T")"
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d chat_id="${TELEGRAM_CHAT_ID}" \
  -d text="$MESSAGE"

echo "[$(date +"%F %T")] ✅ Smart Heavy Cleaner v2.0 執行完成" | tee -a "$LOG_FILE"
