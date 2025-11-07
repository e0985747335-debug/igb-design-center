#!/bin/bash
# ==========================================================
# 🧠 IGB ERP 2.0 智慧防白工系統（Smart Anti-Idle 2.0）
# 版本：v2.0.1 (2025-11-04)
# 修正：
#   ✅ 修復 GitHub Token 未正確轉義
#   ✅ 加入安全外部 Token 讀取機制
# ==========================================================

set -e
cd /home/iven/igb-design-center
LOG_DIR="/home/iven/igb-design-center/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/防白工.log"
TODAY=$(date '+%Y-%m-%d')
TIME=$(date '+%H:%M:%S')

echo "[${TODAY} ${TIME}] 🚀 防白工智慧版 2.0 啟動..." >> "$LOG_FILE"

# ==========================================================
# 🧩 1️⃣ 每日 Commit 自動壓縮與推送
# ==========================================================
echo "[${TODAY} ${TIME}] 🪶 準備壓縮 commit log..." >> "$LOG_FILE"

git add -A
git commit -m "🪶 auto-commit [${TODAY}]" || echo "🪶 無變更可提交" >> "$LOG_FILE"

# 🔐 從安全檔案讀取 Token（推薦方式）
TOKEN_FILE="$HOME/.git_token"
if [ -f "$TOKEN_FILE" ]; then
    GIT_TOKEN=$(cat "$TOKEN_FILE")
else
    echo "⚠️ 找不到 Token 檔案：$TOKEN_FILE" >> "$LOG_FILE"
    exit 1
fi

# GitHub Repository
GIT_REPO="github.com/e0985747335-debug/e-market.git"

echo "[${TODAY} ${TIME}] 🔄 正在推送至 GitHub..." >> "$LOG_FILE"
git push "https://${GIT_TOKEN}@${GIT_REPO}" main >> "$LOG_FILE" 2>&1 || echo "⚠️ GitHub 推送失敗" >> "$LOG_FILE"

# ==========================================================
# 🧠 2️⃣ 每週日產生 Weekly Report
# ==========================================================
DAY_OF_WEEK=$(date +%u)
if [ "$DAY_OF_WEEK" -eq 7 ]; then
    REPORT_DIR="reports"
    mkdir -p "$REPORT_DIR"
    REPORT_FILE="$REPORT_DIR/weekly_report_${TODAY}.md"

    echo "# 🧾 IGB ERP 2.0 Weekly Report - ${TODAY}" > "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "## 📊 Commit 活動摘要" >> "$REPORT_FILE"
    git log --since="7 days ago" --pretty=format:"- %h %s (%cr)" >> "$REPORT_FILE"

    echo "" >> "$REPORT_FILE"
    echo "## 📂 修改最多的檔案" >> "$REPORT_FILE"
    git log --since="7 days ago" --name-only | grep -v '^$' | sort | uniq -c | sort -nr | head -10 >> "$REPORT_FILE"

    echo "" >> "$REPORT_FILE"
    echo "## 🧠 系統日誌摘要" >> "$REPORT_FILE"
    tail -n 30 "$LOG_FILE" >> "$REPORT_FILE"

    git add "$REPORT_FILE"
    git commit -m "📑 Weekly report ${TODAY}"
    git push "https://${GIT_TOKEN}@${GIT_REPO}" main >> "$LOG_FILE" 2>&1
    echo "[${TODAY} ${TIME}] 📑 週報已自動產生並推送。" >> "$LOG_FILE"
fi

# ==========================================================
# 🧰 3️⃣ 自動清理任務（每週一）
# ==========================================================
if [ "$DAY_OF_WEEK" -eq 1 ]; then
    echo "[${TODAY} ${TIME}] 🧹 開始清理舊 log 與 Git 暫存..." >> "$LOG_FILE"
    find "$LOG_DIR" -type f -mtime +30 -delete
    git gc --prune=now --aggressive >> "$LOG_FILE" 2>&1
    echo "[${TODAY} ${TIME}] ✅ 清理完成。" >> "$LOG_FILE"
fi

# ==========================================================
# 📢 4️⃣ 通知機制（Telegram 可選）
# ==========================================================
TELEGRAM_BOT_TOKEN="YOUR_TELEGRAM_BOT_TOKEN"
CHAT_ID="YOUR_CHAT_ID"
MESSAGE="✅ IGB ERP 2.0 防白工 2.0 任務完成於 ${TODAY} ${TIME}"

if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$CHAT_ID" ]; then
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d chat_id="${CHAT_ID}" \
        -d text="${MESSAGE}" >> "$LOG_FILE" 2>&1
fi

echo "[${TODAY} ${TIME}] 🏁 防白工智慧版任務完成。" >> "$LOG_FILE"
