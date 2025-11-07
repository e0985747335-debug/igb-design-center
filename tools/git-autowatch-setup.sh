#!/bin/bash
# ==========================================================
# 🧠 IGB ERP 2.0 - Git AutoWatch 一鍵修復腳本 v1.1
# 功能：
#   ✅ 自動建立 / 修復 systemd service
#   ✅ 啟用桌面通知 (notify-send)
#   ✅ 啟用開機自動啟動
# ==========================================================

SERVICE_PATH="/etc/systemd/system/git-autowatch.service"
WATCH_SCRIPT="/home/iven/igb-design-center/tools/git-autowatch.sh"
LOG_DIR="/home/iven/igb-design-center/logs"
LOG_FILE="$LOG_DIR/git-autowatch.log"

# 建立 logs 目錄
mkdir -p "$LOG_DIR"

# 確認監控腳本存在，若無則自動建立
if [ ! -f "$WATCH_SCRIPT" ]; then
  echo "⚙️  建立監控腳本 $WATCH_SCRIPT ..."
  cat <<'EOF' | tee "$WATCH_SCRIPT" > /dev/null
#!/bin/bash
WATCH_DIR="/home/iven/igb-design-center"
LOG_FILE="/home/iven/igb-design-center/logs/git-autowatch.log"

notify-send "🔍 IGB Git Watch" "自動監控已啟動"

inotifywait -m -r -e modify,create,delete,move "$WATCH_DIR" --exclude '(\.git|\.log|data|__pycache__)' |
while read -r directory events filename; do
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 📂 $events: $filename" >> "$LOG_FILE"
  
  cd "$WATCH_DIR" || exit
  git add . >/dev/null 2>&1
  git commit -m "⚡ 自動更新：$filename" >/dev/null 2>&1 && \
  git push origin main >/dev/null 2>&1 && \
  notify-send "✅ IGB ERP 自動推送完成" "檔案：$filename 已同步至 GitHub"
done
EOF
  chmod +x "$WATCH_SCRIPT"
fi

# 建立 systemd 服務
echo "⚙️  建立 systemd service ..."
sudo tee "$SERVICE_PATH" > /dev/null <<'EOF'
[Unit]
Description=IGB ERP 2.0 Git Auto Watcher
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

# 啟用與啟動服務
sudo systemctl daemon-reload
sudo systemctl enable git-autowatch.service
sudo systemctl restart git-autowatch.service

notify-send "🚀 IGB ERP 2.0 Git AutoWatch 啟動" "已設定為開機自動執行並啟用即時監控"
echo "✅ Git AutoWatch 已成功啟動並設定自動開機！"
