#!/bin/bash
# ==========================================================
# 🚀 IGB ERP 2.0 Port Cleaner
# 自動檢查並釋放常用開發端口
# ==========================================================

PORTS=(3000 8000 5432 80 443)

echo "🔍 正在檢查以下端口是否被佔用: ${PORTS[*]}"
echo "--------------------------------------------------"

for PORT in "${PORTS[@]}"; do
    PID=$(lsof -ti tcp:$PORT)
    if [ -n "$PID" ]; then
        PROC=$(ps -p $PID -o comm=)
        echo "⚠️  Port $PORT 已被 $PROC (PID: $PID) 佔用"
        read -p "是否要釋放此端口？(y/N): " CONFIRM
        if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
            kill -9 $PID && echo "✅ 已釋放 Port $PORT"
        else
            echo "⏭️  跳過 Port $PORT"
        fi
    else
        echo "✅ Port $PORT 可用"
    fi
done

echo "--------------------------------------------------"
echo "🎯 端口檢查完畢，可安全啟動 Docker"
