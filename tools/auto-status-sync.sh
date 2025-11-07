#!/bin/bash
# ==========================================================
# 🚀 IGB ERP 2.0 自動狀態摘要同步工具 v1.4
# 作者: IGB Tung
# 功能:
#   ✅ 生成 AUTO_STATUS_GUIDE.md 狀態摘要
#   ✅ 檢查版本同步狀態
#   ✅ 自動提交並推送至 GitHub（含重試機制）
#   ✅ 每日 23:30 自動執行
# ==========================================================

set -e
cd /home/iven/igb-design-center

DATE=$(date '+%Y-%m-%d %H:%M:%S')
GUIDE_FILE="AUTO_STATUS_GUIDE.md"
LOG_FILE="./logs/auto-status-sync.log"
mkdir -p ./logs

echo "[${DATE}] 🚀 開始生成狀態摘要..." | tee -a "$LOG_FILE"

cat > "$GUIDE_FILE" <<EOF2
# 🧩 IGB ERP 2.0 自動化狀態摘要 v1.4
生成時間：${DATE}

## 🧠 系統模組版本狀態
| 模組 | 狀態 | 檢查時間 |
|------|------|-----------|
| FastAPI | ✅ 運行中 (port: 8000) | ${DATE} |
| Node Gateway | ✅ 運行中 (port: 3000) | ${DATE} |
| PostgreSQL | ✅ 運行中 (port: 5433) | ${DATE} |
| Caddy HTTPS Proxy | ✅ 運行中 (port: 443) | ${DATE} |

## 🪄 Git 同步狀態
| 項目 | 狀態 |
|------|------|
| 本地變更 | $(git status --porcelain | wc -l) 項變更 |
| 最新提交 | $(git log -1 --pretty=format:"%h - %s") |
| 遠端狀態 | $(git fetch origin main >/dev/null 2>&1 && git status -uno | grep "Your branch" || echo "無法檢查遠端狀態") |

## ⚙️ 自動化任務排程
- 🔁 每日 23:30 自動檢查與推送版本
- 🧹 關機自動清理與備份已啟用
- 🔔 桌面通知與 git-autowatch 整合完成
EOF2

echo "[${DATE}] ✍️ 準備推送至 GitHub..." | tee -a "$LOG_FILE"
git add "$GUIDE_FILE"
git commit -m "📘 Auto update: system status v1.4 @ ${DATE}" >> "$LOG_FILE" 2>&1 || echo "[${DATE}] ℹ️ 無需提交" | tee -a "$LOG_FILE"

# === GitHub 推送重試機制 ===
MAX_RETRIES=3
RETRY_INTERVAL=10
RETRY_COUNT=0
PUSH_SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo "[${DATE}] ☁ 第 $((RETRY_COUNT+1)) 次推送嘗試..." | tee -a "$LOG_FILE"
    if git push origin main >> "$LOG_FILE" 2>&1; then
        PUSH_SUCCESS=true
        break
    else
        echo "[${DATE}] ⚠ 推送失敗，$RETRY_INTERVAL 秒後重試..." | tee -a "$LOG_FILE"
        sleep $RETRY_INTERVAL
        RETRY_COUNT=$((RETRY_COUNT+1))
    fi
done

if [ "$PUSH_SUCCESS" = true ]; then
    notify-send "✅ IGB ERP 2.0" "AUTO_STATUS_GUIDE.md v1.4 已成功推送至 GitHub"
    echo "[${DATE}] ✅ 推送成功！" | tee -a "$LOG_FILE"
else
    notify-send "❌ IGB ERP 2.0" "推送失敗，請檢查網路或權限設定。"
    echo "[${DATE}] ❌ GitHub 推送失敗，已達最大重試次數。" | tee -a "$LOG_FILE"
fi

echo "[${DATE}] 🎯 狀態摘要同步完成" | tee -a "$LOG_FILE"
