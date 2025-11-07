#!/bin/bash
# ==========================================================
# 🚀 IGB ERP 2.0 Smart Start Script
# 自動清理常見端口占用 + 啟動 Docker Compose
# ==========================================================

PORTS=(3000 8000 5432 5433 5050 80 443)

echo "🧹 [IGB ERP 2.0] Port 清理程序啟動中..."
echo "--------------------------------------------------"

for PORT in "${PORTS[@]}"; do
    PID=$(lsof -ti tcp:$PORT)
    if [ -n "$PID" ]; then
        PROC=$(ps -p $PID -o comm=)
        echo "⚠️  Port $PORT 已被 $PROC (PID: $PID) 佔用"
        echo "🔪 正在釋放 Port $PORT..."
        kill -9 $PID && echo "✅ 已釋放 Port $PORT"
    else
        echo "✅ Port $PORT 可用"
    fi
done

echo "--------------------------------------------------"
echo "🐳 正在啟動 Docker Compose ..."
docker compose up -d

if [ $? -eq 0 ]; then
    echo "--------------------------------------------------"
    echo "🎯 IGB ERP 2.0 所有服務啟動完成！"
    echo "🌐 可訪問以下端點："
    echo "   - FastAPI Swagger:  https://igb47.eu.org/api/docs"
    echo "   - pgAdmin:          https://igb47.eu.org/pgadmin"
    echo "   - Node Gateway:     http://localhost:3000"
else
    echo "❌ Docker Compose 啟動失敗，請檢查錯誤日誌。"
fi
