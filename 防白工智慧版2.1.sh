#!/bin/bash
# ==========================================================
# 🧠 IGB ERP 2.0 智慧防白工系統（Smart Anti-Idle 2.1）
# ==========================================================

set -e
cd /home/iven/igb-design-center
LOG_DIR="/home/iven/igb-design-center/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/防白工.log"
TODAY=$(date '+%Y-%m-%d')
TIME=$(date '+%H:%M:%S')

echo "[${TODAY} ${TIME}] 🚀 防白工智慧版 2.1 啟動..." >> "$LOG_FILE"

# ===== 讀取 GitHub Token =====
TOKEN_FILE="$HOME/.git_token"
if [ -f "$TOKEN_FILE" ]; then
    GIT_TOKEN=$(cat "$TOKEN_FILE" | tr -d ' \n\r')
else
    echo "[${TODAY} ${TIME}] ⚠ 找不到 Token 檔案：$TOKEN_FILE" >> "$LOG_FILE"
    exit 1
fi

# ===== 每日 Commit & Push =====
git add -A
git commit -m "🪶 auto-commit [${TODAY}]" || echo "🪶 無變更可提交" >> "$LOG_FILE"

GIT_REPO="github.com/e0985747335-debug/e-market.git"
git push https://$GIT_TOKEN@$GIT_REPO main >> "$LOG_FILE" 2>&1 || echo "⚠ GitHub 推送失敗" >> "$LOG_FILE"

echo "[${TODAY} ${TIME}] ✅ 防白工任務完成。" >> "$LOG_FILE"
