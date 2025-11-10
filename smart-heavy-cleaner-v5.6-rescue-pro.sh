#!/bin/bash
# ==========================================================
# 🧠 Smart Heavy Cleaner v5.6 Rescue Pro
# 功能:
#   ✅ 磁碟自動救援與緊急防爆機制
#   ✅ Docker 暫停 + 備份壓縮清理
#   ✅ Git + Telegram 雙向同步
#   ✅ systemd 定時任務支援
# ==========================================================

set -e
PROJECT_ROOT="$(dirname "$0")/.."
DISK_USAGE=$(df -h / | awk 'NR==2{print int($5)}')
DATE=$(date '+%Y-%m-%d_%H-%M-%S')
LOG_DIR="$PROJECT_ROOT/logs"
BACKUP_DIR="$PROJECT_ROOT/backup"
HEAVY_CACHE="$HOME/.cache/igb-heavy"
LOG_FILE="$LOG_DIR/cleaner-$DATE.log"
mkdir -p "$LOG_DIR" "$BACKUP_DIR" "$HEAVY_CACHE"

TELEGRAM_TOKEN="你的BotToken"
TELEGRAM_CHAT_ID="你的ChatID"

notify() {
    MSG="$1"
    echo "[$(date '+%H:%M:%S')] $MSG" | tee -a "$LOG_FILE"
    if [[ -n "$TELEGRAM_TOKEN" && -n "$TELEGRAM_CHAT_ID" ]]; then
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage" \
            -d chat_id="${TELEGRAM_CHAT_ID}" -d text="📢 $MSG" >/dev/null 2>&1
    fi
}

notify "🚀 Smart Heavy Cleaner v5.6 Rescue Pro 啟動 (使用率: ${DISK_USAGE}%)"

# === Step 1: 緊急救援模式 ===
if (( DISK_USAGE > 95 )); then
    notify "🔥 緊急救援模式啟動！磁碟使用率 ${DISK_USAGE}%！"
    if command -v docker >/dev/null 2>&1; then
        notify "⏸️ 暫停所有 Docker 容器..."
        docker ps -q | xargs -r docker stop
    fi

    notify "🗜️ 壓縮最近備份檔案..."
    find "$BACKUP_DIR" -type f -name "*.sql" -mtime -3 -exec gzip {} \; 2>/dev/null

    notify "🧹 清理系統暫存與 Log..."
    journalctl --vacuum-time=2d >/dev/null 2>&1 || true
    find /var/log -type f -name "*.log" -delete 2>/dev/null
    find "$BACKUP_DIR" -type f -mtime +3 -delete 2>/dev/null
    du -sh "$BACKUP_DIR" "$HEAVY_CACHE" 2>/dev/null | tee -a "$LOG_FILE"
    notify "✅ 緊急清理完成，請立即檢查系統容量！"
fi

# === Step 2: 一般清理 ===
if (( DISK_USAGE > 85 )); then
    notify "⚠️ 系統磁碟使用率 ${DISK_USAGE}%：啟動預防性清理..."
    find "$PROJECT_ROOT/backup" -type f -mtime +7 -delete 2>/dev/null
    find "$PROJECT_ROOT" -type f -size +100M 2>/dev/null | while read -r FILE; do
        TARGET="$HEAVY_CACHE$(dirname "$FILE" | sed 's|^\./||')"
        mkdir -p "$TARGET"
        mv "$FILE" "$TARGET/" && echo "(moved to $HEAVY_CACHE)" > "$FILE"
        notify "📦 搬移大檔案: $FILE"
    done
fi

# === Step 3: Git 同步 ===
cd "$PROJECT_ROOT"
git add . >/dev/null 2>&1
git commit -m "🧹 Auto-clean + rescue @ $DATE" >/dev/null 2>&1 || true
if git push origin main --force >/dev/null 2>&1; then
    notify "✅ GitHub 同步成功"
else
    notify "⚠️ Git 推送失敗，請檢查網路或權限"
fi

notify "🎯 Smart Heavy Cleaner v5.6 Rescue Pro 完成！"
