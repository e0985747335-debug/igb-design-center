#!/bin/bash
# ==========================================================
# 🔁 IGB ERP 2.0 - Auto Git Watcher v2.0
# 作者: IGB Tung
# 功能:
#   ✅ 偵測檔案異動 (inotifywait)
#   ✅ 自動 Git add / commit / push
#   ✅ 桌面通知顯示同步狀態
# ==========================================================

WATCH_DIR=~/igb-design-center
LOG_DIR="$WATCH_DIR/logs"
LOG_FILE="$LOG_DIR/git-autowatch.log"
mkdir -p "$LOG_DIR"

cd "$WATCH_DIR"
notify-send "🧩 IGB Auto Git Watcher" "開始監控目錄：$WATCH_DIR"
echo "[🧩 $(date '+%Y-%m-%d %H:%M:%S')] Auto Git Watcher 啟動..." | tee -a "$LOG_FILE"

inotifywait -m -r -e modify,create,delete,move "$WATCH_DIR" --exclude '(\.git|__pycache__|\.log|\.db)' |
while read -r path action file; do
    echo "[$(date '+%H:%M:%S')] ⚡ 偵測變更：$action -> $file" | tee -a "$LOG_FILE"
    notify-send "⚡ IGB Auto Git Watcher" "偵測到變更：$file"

    # 等待 5 秒確保所有檔案儲存完畢
    sleep 5

    # 偵測有無未提交變更
    if [ -n "$(git status --porcelain)" ]; then
        git add . >> "$LOG_FILE" 2>&1
        git commit -m "⚙ AutoSync: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE" 2>&1
        if git push origin main >> "$LOG_FILE" 2>&1; then
            echo "[$(date '+%H:%M:%S')] ✅ AutoPush 成功" | tee -a "$LOG_FILE"
            notify-send "✅ IGB AutoPush 成功" "變更已同步至 GitHub"
        else
            echo "[$(date '+%H:%M:%S')] ⚠ AutoPush 失敗" | tee -a "$LOG_FILE"
            notify-send "⚠ IGB AutoPush 失敗" "請檢查網路或權限"
        fi
    fi
done
