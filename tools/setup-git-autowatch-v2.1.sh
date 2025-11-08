#!/bin/bash
# ==========================================================
# 🚀 IGB ERP 2.0 Git Auto Watcher Setup v2.1 (安全升級版)
# 作者: IGB Tung
# 功能:
#   ✅ 自動備份舊版安裝腳本 (v2.0)
#   ✅ 自動建立或更新 systemd 服務
#   ✅ 版本檢查與安全提示
# ==========================================================

VERSION="v2.1"
OLD_VERSION_FILE="/home/iven/igb-design-center/tools/setup-git-autowatch-v2.0.sh"
BACKUP_FILE="/home/iven/igb-design-center/tools/setup-git-autowatch-v2.0.bak"
SERVICE_FILE="/etc/systemd/system/git-autowatch.service"

echo "🧠 檢查舊版腳本..."
if [ -f "$OLD_VERSION_FILE" ]; then
    echo "📦 發現舊版 v2.0，備份中..."
    sudo cp "$OLD_VERSION_FILE" "$BACKUP_FILE"
    echo "✅ 已備份為：$BACKUP_FILE"
else
    echo "ℹ 沒有找到舊版 v2.0，略過備份。"
fi

echo "🔧 建立或更新 systemd 服務檔案..."

sudo bash -c "cat > $SERVICE_FILE" << 'EOF'
[Unit]
Description=IGB ERP 2.0 Git Auto Watcher (v2.1)
After=network.target

[Service]
Type=simple
User=iven
WorkingDirectory=/home/iven/igb-design-center
ExecStart=/bin/bash -c '
  inotifywait -m -r -e modify,create,delete ./ | while read path action file; do
    echo [$(date +'%Y%m%d_%H%M%S')] Detected $action on $file;
    bash /home/iven/igb-design-center/tools/auto-status-sync.sh;
  done
'
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo chmod 644 $SERVICE_FILE
sudo systemctl daemon-reload
sudo systemctl enable git-autowatch.service
sudo systemctl restart git-autowatch.service

echo "✅ Git Auto Watcher ($VERSION) 已部署完成。"
echo "🔍 使用以下命令查看狀態："
echo "   sudo systemctl status git-autowatch.service --no-pager"
echo "📋 日誌查看：journalctl -u git-autowatch.service -f"
