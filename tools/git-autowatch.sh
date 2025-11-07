#!/bin/bash
WATCH_DIR="/home/iven/igb-design-center"
LOG_FILE="/home/iven/igb-design-center/logs/git-autowatch.log"

notify-send "🔍 IGB Git Watch" "自動監控已啟動"

LAST_CHANGE=$(date +%s)

# 背景批次推送函式
batch_push() {
  local now=$(date +%s)
  local diff=$((now - LAST_CHANGE))
  if [ $diff -ge 3 ]; then
    cd "$WATCH_DIR" || exit
    git add . >/dev/null 2>&1
    git commit -m "⚡ 自動批次更新 $(date '+%H:%M:%S')" >/dev/null 2>&1 && \
    git push origin main >/dev/null 2>&1 && \
    notify-send "✅ IGB ERP 2.0 自動推送完成" "最新修改已同步至 GitHub" || \
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠ 推送失敗" >> "$LOG_FILE"
  fi
}

inotifywait -m -r -e modify,create,delete,move "$WATCH_DIR" --exclude '(\.git|\.log|data|__pycache__)' |
while read -r directory events filename; do
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 📂 $events: $filename" >> "$LOG_FILE"
  LAST_CHANGE=$(date +%s)
  (
    sleep 3
    batch_push
  ) &
done
