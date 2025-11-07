#!/bin/bash
# ==========================================================
# 🚀 IGB ERP 2.0 自動 Git 同步模組
# ==========================================================
cd /home/iven/igb-design-center || exit

# 取得目前狀態時間戳
timestamp=$(date '+%Y%m%d_%H%M%S')

# 檢查是否有變更
if [ -n "$(git status --porcelain)" ]; then
    git add .
    git commit -m "🤖 Auto-sync at ${timestamp}"
    git push origin main && notify-send "✅ IGB ERP Auto Git Push" "推送成功 (${timestamp})" -i dialog-information
else
    notify-send "ℹ️ IGB ERP Auto Git Push" "無變更可推送 (${timestamp})" -i dialog-information
fi
