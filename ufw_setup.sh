# 1. 允許 TCP 埠號 3000 的連入流量
echo "設定 UFW 允許 3000/tcp"
sudo ufw allow 3000/tcp

# 2. 顯示 UFW 狀態，確認規則已生效
echo "UFW 狀態檢查 (應顯示 3000/tcp 允許)"
sudo ufw status
