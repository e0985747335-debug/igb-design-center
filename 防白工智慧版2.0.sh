cat <<'EOF' > /home/iven/igb-design-center/防白工智慧版2.1.sh
#!/bin/bash
# ==========================================================
# 🧠 IGB ERP 2.0 智慧防白工系統（Smart Anti-Idle 2.1）
# 版本：v2.1 (2025-11-04)
# 功能：
#   ✅ 每日自動 commit & push（含 GitHub Token）
#   ✅ 每週自動產生 Markdown 週報
#   ✅ 自動清理 Git 暫存與舊 log
#   ✅ 可選 Telegram / Mail 通知
# ==========================================================

set -e
cd /home/iven/igb-design-center

LOG_DIR="/home/iven/igb-design-center/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/防白工.log"

TODAY=$(date '+%Y-%m-%d')
TIME=$(date '+%H:%M:%S')
DAY_OF_WEEK=$(date +%u)

echo "[${TODAY} ${TIME}] 🚀 防白工智慧版 2.1 啟動..." >> "$LOG_FILE"

# ==========================================================
# 🧩 1⃣ 每日 Commit 自動壓縮與推送
# ==========================================================
echo "[${TODAY} ${TIME}] 🪶 開始壓縮 commit log..." >> "$LOG_FILE"

# 確保 Token 存在
if [ ! -f ~/.git_token ]; then
  echo "[${TODAY} ${TIME}] ❌ 找不到 GitHub Token：~/.git_token" >> "$LOG_FILE"
  exit 1
fi

# 載入 Token
GIT_TOKEN=$(cat ~/.git_token | tr -d ' \n')
GIT_REPO="github.com/e0985747335-debug/e-market.git"

git add -A
git commit -m "🪶 auto-commit [${TODAY}]" || echo "🪶 無變更可提交" >> "$LOG_FILE"

git push https://${GIT_TOKEN}@${GIT_REPO} main >> "$LOG_FILE" 2>&1 || echo "⚠ GitHub 推送失敗" >> "$LOG_FILE"

# ==========================================================
# 🧠 2⃣ 每週日產生 Weekly Report
# ==========================================================
if [ "$DAY_OF_WEEK" -eq 7 ]; then
  REPORT_DIR="reports"
  mkdir -p "$REPORT_DIR"
  REPORT_FILE="$REPORT_DIR/weekly_report_${TODAY}.md"

  {
    echo "# 🧾 IGB ERP 2.0 Weekly Report - ${TODAY}"
    echo ""
    echo "## 📊 Commit 活動摘要"
    git log --since="7 days ago" --pretty=format:"- %h %s (%cr)"
    echo ""
    echo "## 📂 修改最多的檔案"
    git log --since="7 days ago" --name-only | grep -v '^$' | sort | uniq -c | sort -nr | head -10
    echo ""
    echo "## 🧠 系統日誌摘要"
    tail -n 30 "$LOG_FILE"
  } > "$REPORT_FILE"

  git add "$REPORT_FILE"
  git commit -m "📑 Weekly report ${TODAY}"
  git push https://${GIT_TOKEN}@${GIT_REPO} main >> "$LOG_FILE" 2>&1
  echo "[${TODAY} ${TIME}] 📑 週報已自動產生並推送。" >> "$LOG_FILE"
fi

# ==========================================================
# 🧰 3⃣ 自動清理任務（每週一）
# ==========================================================
if [ "$DAY_OF_WEEK" -eq 1 ]; then
  echo "[${TODAY} ${TIME}] 🧹 開始清理舊 log 與 Git 暫存..." >> "$LOG_FILE"
  find "$LOG_DIR" -type f -mtime +30 -delete
  git gc --prune=now --aggressive >> "$LOG_FILE" 2>&1
  echo "[${TODAY} ${TIME}] ✅ 清理完成。" >> "$LOG_FILE"
fi

# ==========================================================
# 📢 4⃣ 通知機制（Telegram 可選）
# ==========================================================
TELEGRAM_BOT_TOKEN=""
CHAT_ID=""
MESSAGE="✅ IGB ERP 2.0 防白工 2.1 任務完成於 ${TODAY} ${TIME}"

if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$CHAT_ID" ]; then
  curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d chat_id="${CHAT_ID}" \
    -d text="${MESSAGE}" >> "$LOG_FILE" 2>&1
fi

echo "[${TODAY} ${TIME}] 🏁 防白工智慧版 2.1 任務完成。" >> "$LOG_FILE"
EOF

chmod +x /home/iven/igb-design-center/防白工智慧版2.1.sh
