#!/bin/bash
# ==========================================================
# 🧠 IGB ERP 2.0 - Git AutoWatch 延遲推送版 v1.2
# 作者: IGB Tung
# 功能：
#   ✅ 自動偵測檔案變化
#   ✅ 延遲 3 秒再執行 Git commit/push（批次整合）
#   ✅ 桌面通知
#   ✅ systemd 自動開機啟動
# ==========================================================

SERVICE_PATH="/etc/systemd/system/git-autowatch.service"
WATCH_SCRIPT="/home/iven/igb-design-center/tools/git-autowatch.sh"
LOG_DIR="/home/iven/igb-design-center/logs"
LOG_FILE="$LOG_DIR/git-autowatch.log"

mkdir -p "$LOG_DIR"

# === 建立或更新監控腳本 ===
echo "⚙️  更新監控腳本 $WATCH_SCRIPT ..."
cat <<'EOF' | tee "$WATCH_SCRIPT" > /dev/null
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
EOF
chmod +x "$WATCH_SCRIPT"

# === systemd service ===
echo "⚙️  建立 systemd 服務..."
sudo tee "$SERVICE_PATH" > /dev/null <<'EOF'
[Unit]
Description=IGB ERP 2.0 Git Auto Watcher (v1.2)
After=network.target

[Service]
Type=simple
User=iven
WorkingDirectory=/home/iven/igb-design-center
ExecStart=/home/iven/igb-design-center/tools/git-autowatch.sh
Restart=always
RestartSec=10
StandardOutput=append:/home/iven/igb-design-center/logs/git-autowatch.log
StandardError=append:/home/iven/igb-design-center/logs/git-autowatch.log
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/iven/.Xauthority

[Install]
WantedBy=default.target
EOF

# === 啟用與啟動 ===
sudo systemctl daemon-reload
sudo systemctl enable git-autowatch.service
sudo systemctl restart git-autowatch.service

notify-send "🚀 IGB ERP Git AutoWatch v1.2 啟動" "已開機自動執行並啟用延遲推送模式"
echo "✅ Git AutoWatch v1.2 已成功啟動並設定完成！"
