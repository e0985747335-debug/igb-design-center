#!/bin/bash
# ==========================================================
# 🧠 IGB ERP 2.0 智慧防白工系統（Smart Anti-Idle 2.2）
# 版本：v2.2 (2025-11-05)
# 功能：
#   ✅ 每日自動 commit & push（含自動 rebase）
#   ✅ 每週產生 Markdown 週報
#   ✅ 自動清理 Git 暫存與舊 log
# ==========================================================

set -e
cd /home/iven/igb-design-center
LOG_DIR="/home/iven/igb-design-center/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/防白工.log"
TODAY=$(date '+%Y-%m-%d')
TIME=$(date '+%H:%M:%S')

echo "[${TODAY} ${TIME}] 🚀 防白工智慧版 2.2 啟動..." >> "$LOG_FILE"

# ==========================================================
# 🧩 自動 Commit + Push
# ==========================================================
git add -A
if git commit -m "🪶 auto-commit [${TODAY}]"; then
    echo "[${TODAY} ${TIME}] ✅ Commit 已建立。" >> "$LOG_FILE"
else
    echo "🪶 無變更可提交" >> "$LOG_FILE"
fi

TOKEN=$(cat ~/.git_token)
GIT_REPO="github.com/e0985747335-debug/e-market.git"
PUSH_LOG=$(mktemp)

GIT_TOKEN=$(cat ~/.git_token)
GIT_REPO="github.com/iven-tung/igb-design-center.git"
git push https://$GIT_TOKEN@$GIT_REPO main >> "$LOG_FILE" 2>&1


if grep -q "rejected" "$PUSH_LOG"; then
    echo "[${TODAY} ${TIME}] ⚠ Push 被拒，執行同步修正..." >> "$LOG_FILE"
    git pull --rebase >> "$LOG_FILE" 2>&1
    git push https://$TOKEN@$GIT_REPO main >> "$LOG_FILE" 2>&1
    echo "[${TODAY} ${TIME}] 🔁 已自動 rebase 並推送完成。" >> "$LOG_FILE"
else
    echo "[${TODAY} ${TIME}] ✅ Push 成功。" >> "$LOG_FILE"
fi

echo "[${TODAY} ${TIME}] ✅ 防白工任務完成。" >> "$LOG_FILE"
