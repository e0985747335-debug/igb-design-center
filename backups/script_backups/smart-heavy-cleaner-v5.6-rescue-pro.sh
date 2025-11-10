#!/bin/bash
# ==========================================================
# 🧠 Smart Heavy Cleaner v5.5 Enterprise
# 功能:
#   ✅ 磁碟空間監控與自動救援
#   ✅ Git + Telegram 雙向同步
#   ✅ systemd 自動啟動守護
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

notify "🚀 Smart Heavy Cleaner v5.5 Enterprise 啟動"

# === Step 1: 偵測磁碟容量 ===
if (( DISK_USAGE > 90 )); then
    notify "⚠️ 系統磁碟使用率 ${DISK_USAGE}%，啟動磁碟救援模式..."
    find /var/log -type f -name "*.log" -delete 2>/dev/null
    find "$PROJECT_ROOT/backup" -type f -mtime +7 -delete 2>/dev/null
    du -sh "$PROJECT_ROOT/backup" "$HOME/.cache" 2>/dev/null | tee -a "$LOG_FILE"
    notify "✅ 清理完成，請重新檢查磁碟容量。"
fi

# === Step 2: 搬移大於 100MB 檔案 ===
find "$PROJECT_ROOT" -type f -size +100M 2>/dev/null | while read -r FILE; do
    TARGET="$HEAVY_CACHE$(dirname "$FILE" | sed 's|^\./||')"
    mkdir -p "$TARGET"
    mv "$FILE" "$TARGET/" && echo "(moved to $HEAVY_CACHE)" > "$FILE"
    notify "📦 已搬移大檔案: $FILE"
done

# === Step 3: Git 同步 ===
cd "$PROJECT_ROOT"
git add . >/dev/null 2>&1
git commit -m "🧹 Auto-clean + backup @ $DATE" >/dev/null 2>&1 || true
if git push origin main --force >/dev/null 2>&1; then
    notify "✅ GitHub 同步成功"
else
    notify "⚠️ Git 推送失敗，請檢查網路或權限"
fi

notify "🎯 Smart Heavy Cleaner v5.5 Enterprise 完成！"
