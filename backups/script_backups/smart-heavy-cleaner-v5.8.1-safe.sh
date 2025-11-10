#!/bin/bash
# Smart Heavy Cleaner v5.8.1 — Safe Diagnostic Edition
# Path: /home/iven/igb-design-center/tools/smart-heavy-cleaner-v5.8.1-safe.sh
# Purpose: Safe diagnostic run — list large files/dirs, suggest cleanup, send Telegram report.
set -euo pipefail

PROJECT_ROOT="/home/iven/igb-design-center"
LOG_DIR="$PROJECT_ROOT/logs"
DIAG_LOG="$LOG_DIR/cleaner-diagnostic-$(date +%Y%m%d_%H%M%S).log"
LATEST_LOG="$LOG_DIR/cleaner-diagnostic-latest.log"
BACKUP_DIR="$PROJECT_ROOT/backup"
HEAVY_CACHE="$HOME/.cache/igb-heavy"

mkdir -p "$LOG_DIR" "$BACKUP_DIR" "$HEAVY_CACHE"

# Telegram (recommended: set via env or export before launching)
TELEGRAM_TOKEN="${TELEGRAM_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"

timestamp(){ date '+%Y-%m-%d %H:%M:%S'; }
log(){ echo "[$(timestamp)] $*"; echo "[$(timestamp)] $*" >> "$DIAG_LOG"; echo "[$(timestamp)] $*" > "$LATEST_LOG"; }

log "🔍 Smart Heavy Cleaner v5.8.1 (Safe Diagnostic) 啟動"

# Disk usage root
DISK_USAGE=$(df -h / | awk 'NR==2{print int($5)}')
log "系統磁碟使用率: ${DISK_USAGE}%"

# Top-level size summary (fast)
log "== 頂級目錄大小 (快速列舉，前20) =="
du -h --max-depth=1 /home/iven 2>/dev/null | sort -hr | head -n 20 | tee -a "$DIAG_LOG"

# Project backup sizes (if any)
log "== igb-design-center 子目錄大小 (重點檢查) =="
du -h --max-depth=2 "$PROJECT_ROOT" 2>/dev/null | sort -hr | head -n 40 | tee -a "$DIAG_LOG"

# 查找超過 100MB 的檔案（最多列 200）
log "== 檔案大小清單 (>100MB，最多200筆) =="
find "$PROJECT_ROOT" -xdev -type f -size +100M -printf '%s\t%p\n' 2>/dev/null | sort -nr | awk '{printf "%.1fMB\t%s\n",$1/1024/1024,$2}' | head -n 200 | tee -a "$DIAG_LOG"

# 建議清理項（安全，不執行刪除）
log "== 建議清理 (模擬，不執行刪除) =="
# 常見可清理目錄
candidates=(
  "$PROJECT_ROOT/backup"
  "$PROJECT_ROOT/.cache"
  "$HOME/.cache"
  "$HOME/.local/share/Trash"
  "$PROJECT_ROOT/yes"
  "$PROJECT_ROOT/node_modules"
)
for d in "${candidates[@]}"; do
  if [ -d "$d" ]; then
    size=$(du -sh "$d" 2>/dev/null | cut -f1)
    log "候選: $d (size: $size)"
  fi
done

# Suggest removing older backups (>7 days) — DO NOT delete, just list
log "== 模擬：過期備份 (>7 天) =="
find "$PROJECT_ROOT/backup" -type f -mtime +7 -printf '%TY-%Tm-%Td %TH:%TM:%TS %p\n' 2>/dev/null | tee -a "$DIAG_LOG" || log "(無找到或無權限)"

# Permissions note for directories that triggered 'permission denied' earlier
log "== 權限檢查 (列出無法讀取的目錄) =="
# Attempt to list common problematic dirs
for d in "$PROJECT_ROOT" "$PROJECT_ROOT/backup" "$PROJECT_ROOT/data" "$HOME"; do
  if [ -d "$d" ]; then
    if ! ls "$d" >/dev/null 2>&1; then
      log "⚠ 無權限列出: $d"
    fi
  fi
done

# Create compact summary
SUMMARY="/tmp/igb_cleaner_diag_summary.txt"
{
  echo "IGB Cleaner v5.8.1 Safe Diagnostic Report"
  echo "Timestamp: $(timestamp)"
  echo "Disk Usage: ${DISK_USAGE}%"
  echo
  echo "Top /home/iven (first lines):"
  du -h --max-depth=1 /home/iven 2>/dev/null | sort -hr | head -n 10
  echo
  echo "Top large files in project (first 20):"
  find "$PROJECT_ROOT" -xdev -type f -size +100M -printf '%s\t%p\n' 2>/dev/null | sort -nr | awk '{printf "%.1fMB\t%s\n",$1/1024/1024,$2}' | head -n 20
  echo
  echo "Candidate cleanup dirs (sizes):"
  for d in "${candidates[@]}"; do
    if [ -d "$d" ]; then du -sh "$d" 2>/dev/null || true; fi
  done
} > "$SUMMARY"

log "診斷報告輸出: $DIAG_LOG"
log "摘要暫放: $SUMMARY"

# Telegram notification helper (safe, will not fail script if not set)
send_telegram(){
  if [ -z "$TELEGRAM_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
    log "⚠ Telegram 未設定 (TELEGRAM_TOKEN/TELEGRAM_CHAT_ID)，跳過發送。"
    return 0
  fi
  payload=$(sed ':a;N;$!ba;s/\n/\\n/g' "$SUMMARY" | sed 's/"/\\"/g')
  curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage" \
    -H "Content-Type: application/json" \
    -d "{\"chat_id\":\"${TELEGRAM_CHAT_ID}\",\"text\":\"IGB Cleaner Diagnostic:\\n${payload}\",\"parse_mode\":\"HTML\"}" \
    >/dev/null 2>&1 || log "⚠ Telegram 傳送失敗"
  log "✅ Telegram 已嘗試發送（若 token 有設定）"
}

send_telegram

log "🎯 Safe diagnostic 完成。請檢查 $DIAG_LOG 與 $SUMMARY。"
exit 0
