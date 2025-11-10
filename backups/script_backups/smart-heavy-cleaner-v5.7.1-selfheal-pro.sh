#!/bin/bash
# ==========================================================
# 🧠 IGB ERP Smart Heavy Cleaner v5.7.1 Self-Heal Pro
# Author: IGB Tung
# Description: 自我修復版，支援 systemd 下穩定運行
# ==========================================================

set -u  # 嚴格模式但不使用 set -e 避免早退
export HOME="/home/iven"
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

PROJECT_ROOT="$HOME/igb-design-center"
LOG_DIR="$PROJECT_ROOT/logs"
BACKUP_DIR="$PROJECT_ROOT/backup"
CACHE_DIR="$HOME/.cache/igb-heavy"
LOG_FILE="$LOG_DIR/cleaner-$(date +%Y-%m-%d_%H-%M-%S).log"

TELEGRAM_TOKEN="7848422362:AAHtSgJK0re_MMzN5epbs64CswHDS4KHYcE"
TELEGRAM_CHAT_ID="6571553579"

notify() {
  MSG="$1"
  echo "[$(date +%H:%M:%S)] $MSG" | tee -a "$LOG_FILE"
  curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage" \
       -d chat_id="$TELEGRAM_CHAT_ID" \
       -d text="📢 $MSG" >/dev/null 2>&1 || true
}

mkdir -p "$LOG_DIR" "$BACKUP_DIR" "$CACHE_DIR"

notify "🚀 Smart Heavy Cleaner v5.7.1 Self-Heal Pro 啟動"

# --- Disk usage check ---
DISK_USAGE=$(df -h / | awk 'NR==2{print int($5)}')
if (( DISK_USAGE > 90 )); then
  notify "⚠️ 磁碟使用率過高 (${DISK_USAGE}%)，開始清理..."
  find "$PROJECT_ROOT" -type f -size +100M | while read -r FILE; do
    TARGET="$CACHE_DIR${FILE#$HOME}"
    mkdir -p "$(dirname "$TARGET")"
    mv "$FILE" "$TARGET"
    notify "📦 搬移大檔案: $FILE"
  done
fi

# --- Git auto backup ---
cd "$PROJECT_ROOT" || exit 0
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git config user.name "iven-tung"
  git config user.email "e0985747335@gmail.com"
  git add . && git commit -m "🧹 Auto-clean $(date '+%Y-%m-%d %H:%M:%S')" >/dev/null 2>&1 || true
  git push origin main >/dev/null 2>&1 && notify "✅ Git 推送完成" || notify "⚠️ Git 推送失敗"
fi

notify "
