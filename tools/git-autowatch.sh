#!/bin/bash
# ==========================================================
# 🧠 IGB ERP 2.0 自動 Git 監控系統 v2.0
# 作者: IGB Tung
# 功能：
#   ✅ 自動偵測檔案變更
#   ✅ 自動 commit + push
#   ✅ 桌面通知 + 日誌記錄
# ==========================================================

WATCH_DIRS=("$HOME/igb-design-center/frontend" "$HOME/igb-design-center/backend" "$HOME/igb-design-center/tools")
LOG_FILE="$HOME/igb-design-center/logs/git-autowatch.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

mkdir -p "$(dirname "$LOG_FILE")"

notify() {
    MESSAGE="$1"
    notify-send "📡 Git AutoWatch" "$MESSAGE"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $MESSAGE" | tee -a "$LOG_FILE"
}

notify "🔍 啟動 Git 自動監控..."

# 確保 inotify-tools 已安裝
if ! command -v inotifywait &>/dev/null; then
    sudo apt install -y inotify-tools libnotify-bin
fi

cd "$HOME/igb-design-center"

# 監控迴圈
while true; do
    inotifywait -r -e modify,create,delete,move "${WATCH_DIRS[@]}" >/dev/null 2>&1
    CHANGES=$(git status --porcelain)

    if [ -n "$CHANGES" ]; then
        DATE=$(date '+%Y-%m-%d %H:%M:%S')
        git add .
        git commit -m "🧩 Auto-commit at $DATE" >> "$LOG_FILE" 2>&1
        if git push origin main >> "$LOG_FILE" 2>&1; then
            notify "✅ 自動推送成功 ($DATE)"
        else
            notify "⚠️ 推送失敗，請檢查網路或 Git 狀態。"
        fi
    fi
done
