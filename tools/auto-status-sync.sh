#!/bin/bash
# ==========================================================
# 🧠 IGB ERP 2.0 | Git Auto Status Sync v2.3 (Whitelist Edition)
# ==========================================================

WATCH_DIR="/home/iven/igb-design-center"
LOG_FILE="$WATCH_DIR/auto-status-sync.log"
RATE_LIMIT_FILE="/tmp/git_autowatch_last_run"
RATE_LIMIT_SECONDS=5

# 🔍 限定允許同步的檔案類型
WHITELIST_REGEX='(\.py|\.sh|\.md|\.yml|\.yaml|\.html|\.js|\.css|\.json|\.sql|\.ini|\.conf|\.service)$'

# Rate-limit control
CURRENT_TIME=$(date +%s)
LAST_TIME=$(cat "$RATE_LIMIT_FILE" 2>/dev/null || echo 0)
if (( CURRENT_TIME - LAST_TIME < RATE_LIMIT_SECONDS )); then
  echo "[$(date +'%Y%m%d_%H%M%S')] ⏱ Skipping sync (rate-limited, $((CURRENT_TIME - LAST_TIME))s since last)" >> "$LOG_FILE"
  exit 0
fi
echo "$CURRENT_TIME" > "$RATE_LIMIT_FILE"

# Detect changed files
CHANGED_FILES=$(git status --porcelain | awk '{print $2}')
MATCHED=false
for FILE in $CHANGED_FILES; do
  if [[ "$FILE" =~ $WHITELIST_REGEX ]]; then
    MATCHED=true
    break
  fi
done

if [ "$MATCHED" = false ]; then
  echo "[$(date +'%Y%m%d_%H%M%S')] 💤 No whitelisted file changes detected, skipping sync." >> "$LOG_FILE"
  exit 0
fi

# Perform auto sync
cd "$WATCH_DIR" || exit 1
git add -A
git commit -m "auto-sync: changes detected $(date +'%Y-%m-%d_%H:%M:%S')" >> "$LOG_FILE" 2>&1
git push origin main >> "$LOG_FILE" 2>&1
echo "[$(date +'%Y%m%d_%H%M%S')] ✅ Auto-sync completed successfully." >> "$LOG_FILE"
