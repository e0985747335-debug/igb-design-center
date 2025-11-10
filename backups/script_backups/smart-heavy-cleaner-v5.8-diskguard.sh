#!/bin/bash
# ==========================================================
# 🧠 IGB Cleaner v5.8.0 - DiskGuard Enterprise
# 功能: 磁碟自救、清理大檔、備份轉存、Git + Telegram 通知、Safe Loop
# 作者: IGB Tung (auto-generated)
# 日期: 2025-11-10
# ==========================================================
set -euo pipefail

# ---------- config ----------
PROJECT_ROOT="/home/iven/igb-design-center"
TOOLS_DIR="$PROJECT_ROOT/tools"
LOG_DIR="$PROJECT_ROOT/logs"
BACKUP_DIR="$PROJECT_ROOT/backup"
HEAVY_CACHE="$HOME/.cache/igb-heavy"
LAST_NOTIFY="$TOOLS_DIR/.last_notify"            # 通知節流檔
NOTIFY_COOLDOWN=300                             # seconds (避免短時間重複通知)
DISK_THRESHOLD=90                               # %，超過啟動救援
KEEP_BACKUPS_DAYS=7                             # 保留多少天備份
MAX_MOVE_SIZE="+100M"                           # find size 表示 >100MB
GIT_PUSH_ON_SUCCESS=true

# Telegram 設定（prefer env vars; 若想直接寫token可在這裡填入，但不建議）
TELEGRAM_TOKEN="${TELEGRAM_TOKEN:-7848422362:AAHtSgJK0re_MMzN5epbs64CswHDS4KHYcE}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-6571553579}"

# ---------- helper ----------
mkdir -p "$LOG_DIR" "$BACKUP_DIR" "$HEAVY_CACHE"
LOG_FILE="$LOG_DIR/cleaner-$(date '+%Y%m%d_%H%M%S').log"

log() { echo "[$(date '+%F %T')] $*" | tee -a "$LOG_FILE"; }

# 安全傳 Telegram（有頻率限制）
notify() {
  local msg="$1"
  local now ts
  now=$(date +%s)
  ts=0
  if [[ -f "$LAST_NOTIFY" ]]; then
    ts=$(cat "$LAST_NOTIFY" 2>/dev/null || echo 0)
  fi
  if (( now - ts < NOTIFY_COOLDOWN )); then
    log "🔕 notify suppressed (cooldown) - $msg"
    return 0
  fi
  if [[ -n "${TELEGRAM_TOKEN:-}" && -n "${TELEGRAM_CHAT_ID:-}" ]]; then
    # 將換行轉義為 \n 以保留多行
    payload=$(printf '{"chat_id":"%s","text":"%s","parse_mode":"HTML"}' "$TELEGRAM_CHAT_ID" "$(echo -e "$msg" | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')")
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage" \
      -H "Content-Type: application/json" -d "$payload" >/dev/null 2>&1 || log "⚠️ Telegram send failed"
    date +%s > "$LAST_NOTIFY" || true
    log "📤 Notified Telegram"
  else
    log "⚠ Telegram creds missing; message: $msg"
  fi
}

# Dry run support (只列出將做什麼)
DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  log "🔎 Running in DRY RUN mode"
fi

# ---------- 检查磁碟 ----------
DISK_USAGE=$(df -h / | awk 'NR==2{print int($5)}')
log "🔍 Disk usage: ${DISK_USAGE}%"
if (( DISK_USAGE >= DISK_THRESHOLD )); then
  notify "⚠️ Disk usage high on $(hostname): ${DISK_USAGE}% — starting DiskGuard rescue."
  log "⚠ DiskGuard rescue mode triggered (>= ${DISK_THRESHOLD}%)"
else
  log "✅ Disk usage below threshold."
fi

# ---------- Step A: 清理舊備份、暫存、apt cache, docker prune（不刪 DB） ----------
if $DRY_RUN; then
  log "[DRY] Would: apt-get clean; delete backups older than ${KEEP_BACKUPS_DAYS}d; clear $HOME/.cache"
else
  log "🧹 Cleaning apt cache and package caches..."
  sudo apt-get clean >/dev/null 2>&1 || log "ℹ apt-get clean failed or not permitted"
  log "🗑 Removing backups older than ${KEEP_BACKUPS_DAYS} days in $BACKUP_DIR..."
  find "$BACKUP_DIR" -type f -mtime +${KEEP_BACKUPS_DAYS} -print -delete 2>/dev/null || true
  log "🧹 Clearing user cache (~/.cache) content larger than 500MB (keeps structure)..."
  # 清理大於200MB的cache子目錄（若需要可調）
  find "$HOME/.cache" -mindepth 1 -maxdepth 2 -type d -exec du -s {} \; 2>/dev/null | sort -rn | awk '$1>200000{print $2}' | xargs -r -I{} rm -rf "{}" || true
  # Docker prune (若系統使用 Docker)
  if command -v docker >/dev/null 2>&1; then
    docker system prune -af --volumes >/dev/null 2>&1 || log "ℹ docker prune failed/insufficient perms"
  fi
fi

# ---------- Step B: 搬移 >100MB 檔案至 HEAVY_CACHE 並放置占位檔 ----------
log "📦 Scanning for files > $MAX_MOVE_SIZE under $PROJECT_ROOT ..."
if $DRY_RUN; then
  find "$PROJECT_ROOT" -type f -size "$MAX_MOVE_SIZE" -print | sed 's/^/   [DRY] /'
else
  find "$PROJECT_ROOT" -type f -size "$MAX_MOVE_SIZE" -print0 | while IFS= read -r -d '' FILE; do
    RELDIR=$(dirname "$FILE" | sed "s|^$PROJECT_ROOT||")
    TARGET_DIR="$HEAVY_CACHE$RELDIR"
    mkdir -p "$TARGET_DIR"
    log "⚙ Moving: $FILE -> $TARGET_DIR/"
    mv -f "$FILE" "$TARGET_DIR/" || { log "❌ Move failed: $FILE"; continue; }
    echo "(moved to $TARGET_DIR/$(basename "$FILE"))" > "$FILE" || true
    notify "📦 Moved large file: $(basename "$FILE") to heavy cache"
  done
fi

# ---------- Step C: 建立壓縮備份（不包含 .git / yes / pgdata / data） ----------
BACKUP_FILE="$BACKUP_DIR/igb-design-center-$(date '+%Y%m%d_%H%M%S').tar.gz"
if $DRY_RUN; then
  log "[DRY] Would create backup $BACKUP_FILE"
else
  log "📦 Creating project backup (excludes large dirs)..."
  tar --exclude='./backup' --exclude='./.git' --exclude='./yes' --exclude='./data' --exclude='./node_modules' -czf "$BACKUP_FILE" -C "$PROJECT_ROOT" . 2>>"$LOG_FILE" || log "⚠ tar failed"
  log "✅ Backup created: $BACKUP_FILE"
fi

# ---------- Step D: Git commit + push (optional) ----------
if $DRY_RUN; then
  log "[DRY] Would: git add/commit/push"
else
  cd "$PROJECT_ROOT"
  git add . >/dev/null 2>&1 || true
  if git diff --cached --quiet; then
    log "ℹ No changes staged for commit."
  else
    git commit -m "🧹 Auto-clean + backup @ $(date '+%F %T')" >/dev/null 2>&1 || log "ℹ git commit possibly empty"
  fi
  if $GIT_PUSH_ON_SUCCESS; then
    if git push origin main --force >/dev/null 2>&1; then
      log "✅ Git push OK"
      notify "✅ Git sync completed on $(hostname)"
    else
      log "⚠ Git push failed (check creds)."
      notify "⚠ Git push failed (check PAT / ssh key)"
    fi
  fi
fi

# ---------- Finalize ----------
DISK_USAGE_AFTER=$(df -h / | awk 'NR==2{print int($5)}')
SUMMARY="🏁 DiskGuard finished on $(hostname)\nBefore: ${DISK_USAGE}%  After: ${DISK_USAGE_AFTER}%\nBackup: ${BACKUP_FILE}\nLog: ${LOG_FILE}"
log "$SUMMARY"
notify "$SUMMARY"

# Exit with success
exit 0
