cat > ~/igb-design-center/tools/git-autowatch-run.sh <<'BASH'
#!/usr/bin/env bash
# git-autowatch-run.sh (v2.1 fixed)
set -euo pipefail

LOGDIR="/home/iven/igb-design-center/logs"
mkdir -p "$LOGDIR"
LOGFILE="$LOGDIR/git-autowatch.log"

# helper: write log + optional notify
log() {
  echo "[$(date +'%Y%m%d_%H%M%S')] $*" | tee -a "$LOGFILE"
}

maybe_notify() {
  # optional desktop notify: will try to read DBUS address saved by user
  DBUS_ADDR_FILE="/home/iven/.dbus_session_address"
  if [ -x "$(command -v notify-send)" ] && [ -f "$DBUS_ADDR_FILE" ]; then
    export DBUS_SESSION_BUS_ADDRESS="$(cat "$DBUS_ADDR_FILE")"
    notify-send "IGB Git Watcher" "$1" || true
  fi
}

cd /home/iven/igb-design-center

# ensure repo is workable
log "🔍 Checking git repo..."
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  log "❗ Not a git repo. Exiting."
  exit 1
fi

# main loop: monitor and call sync script on changes
log "🎯 Starting inotify watch on project..."
inotifywait -m -r -e modify,create,delete,move --format '%w%f %e' . \
| while read -r FILE EVENTS; do
  log "🔔 Change detected: $EVENTS -> $FILE"
  # call sync logic in a separate script (keeps process simple)
  /home/iven/igb-design-center/tools/auto-status-sync.sh >> "$LOGFILE" 2>&1 || log "⚠ auto-status-sync failed"
  maybe_notify "Detected change: $(basename "$FILE") — sync attempted"
done
BASH
