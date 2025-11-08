#!/usr/bin/env bash
cd /home/iven/igb-design-center || exit

LOGFILE="/home/iven/igb-design-center/tools/autowatch-service.log"

inotifywait -m -r -e modify,create,delete --format '%w%f' . | while read -r FILE; do
  case "$FILE" in
    *.sh|*.md|*.py|*.js|*.html)
      echo "[$(date +'%Y%m%d_%H%M%S')] Detected change in $FILE" >> "$LOGFILE"
      /usr/bin/bash /home/iven/igb-design-center/tools/auto-status-sync.sh
      ;;
    *)
      echo "[$(date +'%Y%m%d_%H%M%S')] Ignored change in $FILE" >> "$LOGFILE"
      ;;
  esac
done
