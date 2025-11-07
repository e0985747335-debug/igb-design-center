#!/bin/bash
# ==========================================================
# 🚀 IGB ERP 2.0 | Git Auto Watcher v2.1
# Author: IGB Tung
# Description: Automatically watches repo changes and auto-pushes to GitHub.
# ==========================================================

WORK_DIR="/home/iven/igb-design-center"
LOG_DIR="$WORK_DIR/logs"
LOG_FILE="$LOG_DIR/git-autowatch.log"
SYNC_SCRIPT="$WORK_DIR/tools/auto-status-sync.sh"

mkdir -p "$LOG_DIR"
cd "$WORK_DIR" || exit 1

echo "[$(date +'%Y%m%d_%H%M%S')] 🔄 Git Auto Watcher v2.1 started" | tee -a "$LOG_FILE"

# 判斷是否可用桌面通知
can_notify=false
if [[ -n "$DISPLAY" && -n "$DBUS_SESSION_BUS_ADDRESS" ]]; then
  can_notify=true
fi

# 安全通知函式
notify_safe() {
  local title="$1"
  local message="$2"
  if [ "$can_notify" = true ]; then
    notify-send "$title" "$message"
  fi
  echo "[$(date +'%Y%m%d_%H%M%S')] $title - $message" | tee -a "$LOG_FILE"
}

# 主循環：監控檔案變化
inotifywait -m -r -e modify,create,delete "$WORK_DIR" | while read path action file; do
  notify_safe "🧠 Git Watcher" "Detected $action on $file"

  if [ -f "$SYNC_SCRIPT" ]; then
    bash "$SYNC_SCRIPT" >> "$LOG_FILE" 2>&1
  else
    git add . >> "$LOG_FILE" 2>&1
    git commit -m "🧩 Auto commit: $(date +'%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE" 2>&1
    git push origin main >> "$LOG_FILE" 2>&1
  fi

  if [ $? -eq 0 ]; then
    notify_safe "✅ Auto Push" "Git push success"
  else
    notify_safe "⚠️ Auto Push Failed" "Please check $LOG_FILE"
  fi
done
