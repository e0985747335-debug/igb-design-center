#!/bin/bash
# 🔁 Git Auto Watcher Runtime v2.1
WATCH_DIR="/home/iven/igb-design-center"
LOG_FILE="\$WATCH_DIR/logs/git-autowatch.log"
SYNC_SCRIPT="\$WATCH_DIR/tools/auto-status-sync.sh"

echo "[\$(date +'%Y%m%d_%H%M%S')] 🔍 啟動監控 \$WATCH_DIR" | tee -a "\$LOG_FILE"

inotifywait -m -r -e modify,create,delete,move "\$WATCH_DIR" --exclude '(\.git|logs|__pycache__)' | while read path action file; do
  echo "[\$(date +'%Y%m%d_%H%M%S')] 🔔 偵測變更: \$action -> \$file" | tee -a "\$LOG_FILE"
  bash "\$SYNC_SCRIPT"
done
