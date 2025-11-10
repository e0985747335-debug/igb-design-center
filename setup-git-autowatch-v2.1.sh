#!/usr/bin/env bash
# ==========================================================
# 🧠 IGB ERP 2.0 - Git Auto Watcher v2.1 Setup Script
# 作者: IGB Tung
# 功能:
#   ✅ 自動建立/更新 git-autowatch.service
#   ✅ 建立 watch & push 腳本
#   ✅ 自動啟用 systemd service
#   ✅ 安裝必要套件 + 日誌初始化
# ==========================================================

set -e
echo "🚀 開始部署 IGB ERP 2.0 Git Auto Watcher v2.1 ..."

# 確保路徑
REPO_DIR="/home/iven/igb-design-center"
TOOLS_DIR="$REPO_DIR/tools"
LOG_DIR="$REPO_DIR/logs"
mkdir -p "$TOOLS_DIR" "$LOG_DIR"

echo "📦 安裝必要套件..."
sudo apt update -y
sudo apt install -y inotify-tools git libnotify-bin

# ==========================================================
# 1️⃣ 生成 auto-status-sync.sh
# ==========================================================
cat > "$TOOLS_DIR/auto-status-sync.sh" <<'EOF'
#!/usr/bin/env bash
# auto-status-sync.sh - v2.1
set -euo pipefail

REPO_DIR="/home/iven/igb-design-center"
LOGDIR="$REPO_DIR/logs"
mkdir -p "$LOGDIR"
LOGFILE="$LOGDIR/auto-status-sync.log"
LAST_RUN_FILE="$LOGDIR/.last_auto_sync"

now() { date +%s; }
log() { echo "[$(date +'%Y%m%d_%H%M%S')] $*" | tee -a "$LOGFILE"; }

cd "$REPO_DIR"

if [ -f "$LAST_RUN_FILE" ]; then
  last=$(cat "$LAST_RUN_FILE")
  delta=$(( $(now) - last ))
  if [ "$delta" -lt 60 ]; then
    log "⏱ 跳過同步 (距上次 ${delta}s)"
    exit 0
  fi
fi

if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -m "🧩 Auto-sync @ $(date +'%Y-%m-%d_%H:%M:%S')" || true
else
  log "ℹ 沒有變更。"
  echo "$(now)" > "$LAST_RUN_FILE"
  exit 0
fi

REMOTE="origin"
if ! git ls-remote "$REMOTE" &>/dev/null; then
  log "⚠ 遠端無法連線 ($REMOTE)"
  echo "$(now)" > "$LAST_RUN_FILE"
  exit 1
fi

if git push "$REMOTE" HEAD:main --porcelain; then
  log "✅ 已自動推送至 GitHub。"
  echo "$(now)" > "$LAST_RUN_FILE"
  DBUS_ADDR_FILE="/home/iven/.dbus_session_address"
  if [ -x "$(command -v notify-send)" ] && [ -f "$DBUS_ADDR_FILE" ]; then
    export DBUS_SESSION_BUS_ADDRESS="$(cat "$DBUS_ADDR_FILE")"
    notify-send "IGB Auto Sync" "✅ 已推送至 GitHub"
  fi
else
  log "❌ 推送失敗，請檢查帳號或權限。"
fi
EOF

chmod +x "$TOOLS_DIR/auto-status-sync.sh"

# ==========================================================
# 2️⃣ 生成 git-autowatch-run.sh
# ==========================================================
cat > "$TOOLS_DIR/git-autowatch-run.sh" <<'EOF'
#!/usr/bin/env bash
# git-autowatch-run.sh - v2.1
set -euo pipefail

REPO="/home/iven/igb-design-center"
LOGDIR="$REPO/logs"
mkdir -p "$LOGDIR"
LOGFILE="$LOGDIR/git-autowatch.log"

log() {
  echo "[$(date +'%Y%m%d_%H%M%S')] $*" | tee -a "$LOGFILE"
}

maybe_notify() {
  DBUS_ADDR_FILE="/home/iven/.dbus_session_address"
  if [ -x "$(command -v notify-send)" ] && [ -f "$DBUS_ADDR_FILE" ]; then
    export DBUS_SESSION_BUS_ADDRESS="$(cat "$DBUS_ADDR_FILE")"
    notify-send "IGB Git Watcher" "$1" || true
  fi
}

cd "$REPO"
log "🎯 啟動 IGB Git Auto Watcher..."

inotifywait -m -r -e modify,create,delete,move --format '%w%f %e' . |
while read -r FILE EVENTS; do
  log "🔔 偵測變更：$EVENTS -> $FILE"
  /home/iven/igb-design-center/tools/auto-status-sync.sh >> "$LOGFILE" 2>&1 || log "⚠ 同步失敗"
  maybe_notify "📡 已偵測變更：$(basename "$FILE")，已同步至 GitHub"
done
EOF

chmod +x "$TOOLS_DIR/git-autowatch-run.sh"

# ==========================================================
# 3️⃣ 建立 systemd 服務
# ==========================================================
sudo tee /etc/systemd/system/git-autowatch.service > /dev/null <<'EOF'
[Unit]
Description=IGB ERP Auto Git Watch & Push Service (v2.1)
After=network.target

[Service]
Type=simple
User=iven
WorkingDirectory=/home/iven/igb-design-center
ExecStart=/home/iven/igb-design-center/tools/git-autowatch-run.sh
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# ==========================================================
# 4️⃣ 啟用與啟動
# ==========================================================
echo "⚙️  重新載入 systemd..."
sudo systemctl daemon-reload
sudo systemctl enable git-autowatch.service
sudo systemctl restart git-autowatch.service

echo "✅ Git Auto Watcher v2.1 部署完成！"
echo "📋 可查看日誌：tail -f $LOG_DIR/git-autowatch.log"
echo "🧩 狀態檢查：sudo systemctl status git-autowatch.service --no-pager"
EOF
