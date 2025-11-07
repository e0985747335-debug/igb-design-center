#!/usr/bin/env bash
# ============================================================
# 🚀 防白工智慧版 3.0 + Smart Heavy Cleaner (IGB ERP 2.0)
# Author: IGB Tung
# Updated: 2025-11-03
# ============================================================

set -e

# === [0] 初始化環境 ===
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$BASE_DIR/logs"
LOG_FILE="$LOG_DIR/防白工智慧版3.0.log"
mkdir -p "$LOG_DIR"

echo "=============================" | tee -a "$LOG_FILE"
echo "🧠 防白工智慧版 3.0 啟動 $(date)" | tee -a "$LOG_FILE"
echo "=============================" | tee -a "$LOG_FILE"

# === [1] 自動清理大型檔案 ===
echo "🧹 啟動 Smart Heavy Cleaner..." | tee -a "$LOG_FILE"
if [ -f "$BASE_DIR/tools/smart-heavy-cleaner.sh" ]; then
    bash "$BASE_DIR/tools/smart-heavy-cleaner.sh" >> "$LOG_FILE" 2>&1
else
    echo "⚠️ 找不到 smart-heavy-cleaner.sh，略過此步驟。" | tee -a "$LOG_FILE"
fi

# === [2] Git 壓縮與自動同步 ===
echo "📦 Git 智慧壓縮與同步..." | tee -a "$LOG_FILE"

cd "$BASE_DIR"

# 清除暫存與重新初始化 Git 壓縮
git gc --prune=now --aggressive >> "$LOG_FILE" 2>&1 || echo "⚠️ Git 清理失敗，略過"

# 若尚未設定遠端，則提示
if ! git remote | grep -q origin; then
    echo "⚠️ 未偵測到 Git 遠端（origin），請先設定：" | tee -a "$LOG_FILE"
    echo "   git remote add origin <你的 GitHub 倉庫 URL>" | tee -a "$LOG_FILE"
else
    git add . >> "$LOG_FILE" 2>&1
    git commit -m "🧠 防白工智慧版 3.0 自動同步：$(date '+%F %T')" >> "$LOG_FILE" 2>&1 || echo "✅ 沒有新變更可提交"
    git push origin main --force >> "$LOG_FILE" 2>&1 || echo "⚠️ Git 推送失敗，請檢查權限"
fi

# === [3] Docker / Cache 清理 ===
echo "🐳 Docker & 系統暫存清理..." | tee -a "$LOG_FILE"

# Docker
docker system prune -af >> "$LOG_FILE" 2>&1 || echo "⚠️ Docker 清理略過"

# 系統暫存
sudo rm -rf /tmp/* /var/tmp/* ~/.cache/* 2>/dev/null || true

# === [4] 執行環境健康檢查 ===
echo "🩺 系統健康檢查..." | tee -a "$LOG_FILE"
df -h | tee -a "$LOG_FILE"
free -h | tee -a "$LOG_FILE"

# === [5] 結束 ===
echo "✅ 防白工智慧版 3.0 已完成全部任務！" | tee -a "$LOG_FILE"
echo "🕓 完成時間：$(date)" | tee -a "$LOG_FILE"
echo "======================================" | tee -a "$LOG_FILE"
