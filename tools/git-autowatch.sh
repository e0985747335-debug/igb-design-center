#!/bin/bash
LOG_FILE="/home/iven/igb-design-center/logs/git-autowatch.log"
cd /home/iven/igb-design-center

# 建立 logs 目錄（如果不存在）
mkdir -p "$(dirname "$LOG_FILE")"

inotifywait -m -r -e modify,create,delete ./ | while read path action file; do
  echo "[$(date +'%Y%m%d_%H%M%S')] 🧠 Detected $action on $file" | tee -a "$LOG_FILE"
  git add .
  git commit -m "🧩 Auto commit: $(date +'%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE" 2>&1
  git push origin main >> "$LOG_FILE" 2>&1 && \
    notify-send "✅ Git Auto Push 成功" "已同步至 GitHub" || \
    notify-send "⚠️ Git Auto Push 失敗" "請手動檢查連線或權限"
done
