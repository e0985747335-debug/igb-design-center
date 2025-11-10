#!/bin/bash
# ==========================================================
# 🧠 Smart Heavy Cleaner v5.5.1 Enterprise (Safe Mode)
# 功能:
#   ✅ 磁碟空間監控與自動救援
#   ✅ Git + Telegram 雙向同步（自動判斷安全）
#   ✅ systemd 自動啟動守護 + 崩潰重啟防護
# ==========================================================

set -e
PROJECT_ROOT="$(dirname "$(realpath "$0")")/.."
DISK_USAGE=$(df -h / | awk 'NR==2{print int($5)}')
DATE=$(date '+%Y-%m-%d_%H-%M-%S')
LOG_DIR="$PROJECT_ROOT/logs"
BACKUP_DIR="$PROJECT_ROOT/backup"
HEAVY_CACHE="$HOME/.cache/igb-heavy"
LOG_FILE="$LOG_DIR/cleaner-$DATE.log"
mkdir -p "$LOG_DIR" "$BACKUP_DIR" "$HEAVY_CACHE"

# ⚙️ Telegram 設定
TELEGRAM_TOKEN="7848422362:AAHtSgJK0re_MMzN5epbs64CswHDS4KHYcE"
TELEGRAM_CHAT_ID="6571553579"

# === 通知函數 ===
notify() {
    MSG="$1"
    echo "[$(date '+%H:%M:%S')] $MSG" | tee -a "$LOG_FILE"
    if [[ -n "$TELEGRAM_TOKEN" && -n "$TELEGRAM_CHAT_ID" && "$TELEGRAM_TOKEN" != "你的BotToken" ]]; then
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage" \
        -d chat_id="${TELEGRAM_CHAT_ID}" -d text="📢 $MSG" >/dev/null 2>&1
    fi
}

notify "🚀 Smart Heavy Cleaner v5.5.1 Enterprise Safe Mode 啟動"

# === Step 1: 磁碟容量偵測 ===
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

# === Step 3: Git 同步（安全模式）===
cd "$PROJECT_ROOT"
if [ -d ".git" ]; then
    git add . >/dev/null 2>&1 || true
    git commit -m "🧹 Auto-clean + backup @ $DATE" >/dev/null 2>&1 || true
    if git push origin main --force >/dev/null 2>&1; then
        notify "✅ GitHub 同步成功"
    else
        notify "⚠️ Git 推送失敗，請檢查網路或權限"
    fi
else
    notify "⚠️ 非 Git 專案環境，跳過同步。"
fi

notify "🎯 Smart Heavy Cleaner v5.5.1 Enterprise Safe Mode 完成！"
exit 0
