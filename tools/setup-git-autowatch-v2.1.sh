#!/bin/bash
# ==========================================================
# 🚀 IGB ERP 2.0 - Git Auto Watcher Setup v2.1
# Author: IGB Tung
# Date: 2025-11-08
# ==========================================================

SERVICE_FILE="/etc/systemd/system/git-autowatch.service"
WATCH_DIR="/home/iven/igb-design-center"
RUN_SCRIPT="$WATCH_DIR/tools/git-autowatch-run.sh"
SYNC_SCRIPT="$WATCH_DIR/tools/auto-status-sync.sh"
LOG_DIR="$WATCH_DIR/logs"

echo "[$(date +'%F %T')] 🧠 建立 Git Auto Watcher v2.1 安裝流程..."

# ==========================================================
# 1️⃣ 確保必要套件存在
# ==========================================================
sudo apt install inotify-tools libnotify-bin -y

# ==========================================================
# 2️⃣ 建立目錄與日誌
# ==========================================================
mkdir -p "$LOG_DIR"
touch "$LOG_DIR/git-autowatch.log"
touch "$LOG_DIR/auto-status-sync.log"
chmod 755 "$WATCH_DIR/tools"/*.sh

# ==========================================================
# 3️⃣ 建立監控執行腳本
# ==========================================================
tee "$RUN_SCRIPT" > /dev/null <<'EOR'
#!/bin/bash
# 🔁 Git Auto Watcher Runtime v2.1
WATCH_DIR="/home/iven/igb-design-center"
LOG_FILE="\$WATCH_DIR/logs/git-autowatch.log"
SYNC_SCRIPT="\$WATCH_DIR/tools/auto-status-sync.sh"

echo "[\$(date +'%Y%m%d_%H%M%S')] 🔍 啟動監控 \$WATCH_DIR" | tee -a "\$LOG_FILE"

inotifywait -m -r -e modify,create,delete,move "\$WATCH_DIR" --exclude '(\.git|logs|__pycache__)' | while read path action file; do
  echo "[\$(date +'%Y%m%d_%H%M%S')] 🔔 偵測變更: \$action -> \$file" | tee -a "\$LOG_FILE"
  bash "\$SYNC_SCRIPT"
done
EOR

chmod +x "$RUN_SCRIPT"

# ==========================================================
# 4️⃣ 建立 systemd 服務檔案
# ==========================================================
sudo tee "$SERVICE_FILE" > /dev/null <<'EOS'
[Unit]
Description=IGB ERP 2.0 Git Auto Watcher (v2.1)
After=network.target

[Service]
Type=simple
User=iven
WorkingDirectory=/home/iven/igb-design-center
ExecStart=/bin/bash /home/iven/igb-design-center/tools/git-autowatch-run.sh
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOS

# ==========================================================
# 5️⃣ 啟動與驗證服務
# ==========================================================
echo "[$(date +'%F %T')] ⚙️ 重新載入 systemd..."
sudo systemctl daemon-reexec
sudo systemctl daemon-reload
sudo systemctl enable git-autowatch.service
sudo systemctl restart git-autowatch.service

sleep 3
sudo systemctl status git-autowatch.service --no-pager -l | grep "Active:" || echo "⚠️ 請手動檢查 systemctl 狀態"

echo "[$(date +'%F %T')] ✅ Git Auto Watcher v2.1 安裝完成！"
echo "📜 Service File: $SERVICE_FILE"
echo "📂 Logs: $LOG_DIR"
