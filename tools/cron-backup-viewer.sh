#!/bin/bash
# ==========================================================
# 🧭 Cron Backup Viewer v1.0
# 作者：IGB Tung
# 功能：
#   ✅ 自動列出所有 cron 備份檔
#   ✅ 檢視指定備份內容
#   ✅ 一鍵還原 crontab
# ==========================================================

BACKUP_DIR="$HOME"
PATTERN="crontab_backup_*.txt"

echo "🧭 Cron Backup Viewer"
echo "==============================="

# 1️⃣ 列出所有備份檔案
echo "📁 備份檔案清單："
ls -1t "$BACKUP_DIR"/$PATTERN 2>/dev/null | nl -w2 -s'. '

if [ $? -ne 0 ]; then
    echo "⚠️ 尚未找到任何備份檔案！"
    exit 1
fi

# 2️⃣ 讓使用者選擇操作
echo ""
read -p "請輸入要【檢視或還原】的編號 (直接 Enter 取消)： " CHOICE

if [ -z "$CHOICE" ]; then
    echo "🚫 已取消操作。"
    exit 0
fi

SELECTED_FILE=$(ls -1t "$BACKUP_DIR"/$PATTERN | sed -n "${CHOICE}p")

if [ ! -f "$SELECTED_FILE" ]; then
    echo "❌ 找不到選擇的檔案！"
    exit 1
fi

echo ""
echo "🎯 選擇的檔案：$SELECTED_FILE"
echo ""
read -p "請選擇操作 [v=檢視 / r=還原 / q=離開]：" ACTION

case "$ACTION" in
    v|V)
        echo ""
        echo "📄 檔案內容："
        echo "-------------------------------"
        cat "$SELECTED_FILE"
        ;;
    r|R)
        echo "⚙️ 正在還原 crontab..."
        crontab "$SELECTED_FILE"
        echo "✅ 已成功還原 crontab 設定。"
        ;;
    q|Q)
        echo "👋 離開 Cron Backup Viewer。"
        ;;
    *)
        echo "⚠️ 無效選項，已中止。"
        ;;
esac
