#!/usr/bin/env bash
# auto-status-sync.sh - atomic sync with basic rate limiting
set -euo pipefail

REPO_DIR="/home/iven/igb-design-center"
LOGDIR="$REPO_DIR/logs"
mkdir -p "$LOGDIR"
LOGFILE="$LOGDIR/auto-status-sync.log"
LAST_RUN_FILE="$LOGDIR/.last_auto_sync"

now() { date +%s; }
log() { echo "[$(date +'%Y%m%d_%H%M%S')] $*" | tee -a "$LOGFILE"; }

cd "$REPO_DIR"

# rate limit: at most once every 60s
if [ -f "$LAST_RUN_FILE" ]; then
  last=$(cat "$LAST_RUN_FILE")
  delta=$(( $(now) - last ))
  if [ "$delta" -lt 60 ]; then
    log "⏱ Skipping sync (rate-limited, ${delta}s since last)"
    exit 0
  fi
fi

# ensure no ongoing operations
if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -m "auto-sync: changes detected $(date +'%Y-%m-%d_%H:%M:%S')" || true
else
  log "ℹ No changes to commit."
  echo "$(now)" > "$LAST_RUN_FILE"
  exit 0
fi

# push with safety: check remote reachable
REMOTE="origin"
if ! git ls-remote "$REMOTE" &>/dev/null; then
  log "⚠ Remote $REMOTE unreachable — abort push."
  echo "$(now)" > "$LAST_RUN_FILE"
  exit 1
fi

# attempt push
if git push "$REMOTE" HEAD:main --porcelain; then
  log "✅ Push successful."
  echo "$(now)" > "$LAST_RUN_FILE"
  # optional desktop notify (if DBUS address saved)
  DBUS_ADDR_FILE="/home/iven/.dbus_session_address"
  if [ -x "$(command -v notify-send)" ] && [ -f "$DBUS_ADDR_FILE" ]; then
    export DBUS_SESSION_BUS_ADDRESS="$(cat "$DBUS_ADDR_FILE")"
    notify-send "IGB Auto Sync" "Pushed changes to remote."
  fi
else
  log "❌ Push failed (check git remote / credentials)."
  exit 2
fi
