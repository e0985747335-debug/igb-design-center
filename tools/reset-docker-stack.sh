#!/bin/bash
# ==========================================================
# 🚀 IGB ERP 2.0 — Docker Stack Reset Utility
# 作者: IGB Tung
# 位置: tools/reset-docker-stack.sh
# 功能: 清理卡住的容器、網路、volume 並重建堆疊
# ==========================================================

set -e

PROJECT="igb-design-center"
NETWORK="${PROJECT}_igb_net"

echo "🧹 [1/5] 停止並移除現有容器..."
docker compose down --remove-orphans || true

echo "🔍 [2/5] 檢查殘留 network..."
if docker network inspect "$NETWORK" &>/dev/null; then
  echo "⚠️ 發現殘留網路：$NETWORK，嘗試移除..."
  docker network rm "$NETWORK" || echo "⚠️ 網路仍被佔用，將嘗試強制清理容器..."
fi

echo "🧯 [3/5] 清理孤立容器..."
docker ps -aq --filter "network=$NETWORK" | xargs -r docker rm -f || true

echo "🧩 [4/5] 移除未使用的資源..."
docker system prune -af --volumes

echo "🚀 [5/5] 重新啟動 IGB ERP Stack..."
docker compose up -d --build

echo "✅ 已完成重建。檢查服務狀態："
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo "🌐 若有設定 Caddy，請稍候 1-2 分鐘等待 SSL 憑證自動續期。"
