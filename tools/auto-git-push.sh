#!/bin/bash
# ==========================================================
# 🚀 IGB ERP 2.0 Smart Auto Git Push v2.0
# 作者: IGB Tung
# 功能:
#   ✅ 自動偵測修改並提交
#   ✅ 自動推送 GitHub（含日誌）
#   ✅ 整合 Cron 備份後執行
# ==========================================================

set -e
cd ~/igb-design-center
DATE=$(date '+%Y%m%d_%H%M%S')
LOG_DIR="./logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/git-autopush.log"

echo "[$DATE] 🚀 開始自動推送..." | tee -a "$LOG_FILE"

# 1️⃣ 檢查是否有變更
if [ -n "$(git status --porcelain)" ]; then
    echo "[$DATE] 🧩 偵測到變更，準備提交..." | tee -a "$LOG_FILE"
    git add .
    git commit -m "🧠 AutoPush: weekly sync $(date '+%Y-%m-%d %H:%M')" >> "$LOG_FILE" 2>&1
    git push origin main >> "$LOG_FILE" 2>&1 && \
        notify-send "✅ AutoPush 成功" "已同步至 GitHub" || \
        notify-send "⚠ AutoPush 失敗" "請檢查網路或權限"
else
    echo "[$DATE] ℹ 無檔案變更，略過推送。" | tee -a "$LOG_FILE"
    notify-send "ℹ AutoPush 略過" "沒有檔案變更"
fi

echo "[$DATE] 🎯 AutoPush 完成！" | tee -a "$LOG_FILE"

