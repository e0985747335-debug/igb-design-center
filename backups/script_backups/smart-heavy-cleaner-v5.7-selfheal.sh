#!/bin/bash
# ==========================================================
# 🧠 IGB ERP Smart Heavy Cleaner v5.7.2 (Enterprise Safe Loop)
# Author: IGB Tung
# Date: 2025-11-10
# Features:
#   - Safe loop (prevents repeated Telegram spam)
#   - Auto backup & cleanup
#   - Telegram notification with cooldown
# ==========================================================

set -euo pipefail

# === 基本參數 ===
PROJECT_ROOT="/home/iven/igb-design-center"
TOOLS_DIR="$PROJECT_ROOT/tools"
LOG_DIR="$PROJECT_ROOT/logs"
BACKUP_DIR="$PROJECT_ROOT/backup"
HEAVY_CACHE="/home/iven/.cache/igb-heavy"
LOG_FILE="$LOG_DIR/cleaner-$(date '+%Y-%m-%d_%H-%M-%S').log"

mkdir -p "$LOG_DIR" "$BACKUP_DIR" "$HEAVY_CACHE"

# === Telegram 設定 ===
TELEGRAM_TOKEN="7848422362:AAHtSgJK0re_MMzN5epbs64CswHDS4KHYcE"
TELEGRAM_CHAT_ID="6571553579"
COOLDOWN_FILE="$TOOLS_DIR/.telegram_last_send"
COOLDOWN_MINUTES=15

# === 功能函式 ===
send_telegram() {
    local message="$1"
    local now=$(date +%s)
    local last_send=0

    if [[ -f "$COOLDOWN_FILE" ]]; then
        last_send=$(cat "$COOLDOWN_FILE")
    fi

    local elapsed=$(( (now - last_send) / 60 ))

    if (( elapsed < COOLDOWN_MINUTES )); then
        echo "⚠️ Telegram cooldown active (${elapsed}m elapsed)" >> "$LOG_FILE"
        return 0
    fi

    echo "$now" > "$COOLDOWN_FILE"
    local encoded_message
    encoded_message=$(echo -e "$message" | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')

    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage" \
        -H "Content-Type: application/json" \
        -d "{\"chat_id\":\"${TELEGRAM_CHAT_ID}\",\"text\":\"${encoded_message}\",\"parse_mode\":\"HTML\"}" \
        >> "$LOG_FILE" 2>&1

    echo "[INFO] Telegram message sent at $(date)" >> "$LOG_FILE"
}

backup_project() {
    local dest="$BACKUP_DIR/igb_backup_$(date '+%Y%m%d_%H%M%S').tar.gz"
    echo "🧭 Creating backup to $dest" >> "$LOG_FILE"
    tar -czf "$dest" -C "$PROJECT_ROOT" . >> "$LOG_FILE" 2>&1
}

cleanup_temp() {
    echo "🧹 Cleaning temporary caches..." >> "$LOG_FILE"
    rm -rf "$HEAVY_CACHE"/* 2>/dev/null || true
}

check_disk() {
    local usage
    usage=$(df -h / | awk 'NR==2{print int($5)}')
    echo "[Disk] Current usage: ${usage}%" >> "$LOG_FILE"
    echo "$usage"
}

# === 主邏輯 ===
echo "🚀 IGB ERP Smart Cleaner v5.7.2 starting..." | tee -a "$LOG_FILE"

DISK_USAGE=$(check_disk)
if (( DISK_USAGE > 85 )); then
    backup_project
    cleanup_temp
    send_telegram "🧠 <b>IGB ERP Self-Heal Triggered</b>\n💾 Disk Usage: ${DISK_USAGE}%\n📦 Backup & cleanup completed.\n🕒 $(date '+%Y-%m-%d %H:%M:%S')"
else
    echo "[OK] Disk usage within safe range." >> "$LOG_FILE"
fi

echo "✅ IGB ERP Cleaner v5.7.2 finished at $(date)" >> "$LOG_FILE"
exit 0
