#!/bin/bash
# ==========================================================
# 🧠 IGB ERP 2.0 Auto Git Watcher v2.0
# 作者: IGB Tung
# 功能:
#   ✅ 自動監測本地變更 (每 30 秒)
#   ✅ 自動 add / commit / push
#   ✅ 顯示桌面通知 (notify-send)
#   ✅ 日誌記錄至 logs/git-autowatch.log
# ==========================================================

cd ~/igb-design-center || exit 1
LOG_DIR="logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/git-autowatch.log"

DATE=$(date '+%Y%m%d_%H%M%S')
echo "[$DATE] 🚀 啟動 Git Auto Watcher..." | tee -a "$LOG_FILE"

# 每 30 秒檢查一次變更
while true; do
    DATE=$(date '+%Y-%m-%d %H:%M:%S')

    # 檢查有無變更
    if [[ -n $(git status --porcelain) ]]; then
        echo "[$DATE] 🔄 偵測到檔案變更，準備提交..." | tee -a "$LOG_FILE"
        git add .
        git commit -m "🤖 Auto-sync: $DATE" >> "$LOG_FILE" 2>&1
        if git push origin main >> "$LOG_FILE" 2>&1; then
            echo "[$DATE] ✅ 自動推送成功！" | tee -a "$LOG_FILE"
            notify-send "IGB ERP 2.0" "📤 已自動同步至 GitHub ✅"
        else
            echo "[$DATE] ⚠ 推送失敗，稍後重試..." | tee -a "$LOG_FILE"
            notify-send "IGB ERP 2.0" "⚠ Git 推送失敗，稍後重試"
        fi
    fi

    sleep 30
done
