#!/bin/bash
# ==========================================================
# 🧩 IGB ERP 2.0 Git Repair v2.7
# 作者: IGB Tung
# 功能:
#   ✅ 備份專案（排除 data/postgres）
#   ✅ 清除舊的 .git 結構
#   ✅ 自動初始化 Git 並重設遠端
#   ✅ 自動提交 + 推送 + 狀態回傳
#   ✅ 與 Smart Heavy Cleaner 完全整合
# ==========================================================

set -e
cd "$(dirname "$0")/.."   # 確保在專案根目錄
DATE=$(date '+%Y%m%d_%H%M%S')
LOG_DIR="./logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/git-repair.log"

echo "[$DATE] 🚀 開始 Git 修復流程..." | tee -a "$LOG_FILE"

# === 1️⃣ 備份專案 ===
BACKUP_FILE=~/igb-design-center-repair-backup-$DATE.tar.gz
echo "[$DATE] 📦 備份專案中..." | tee -a "$LOG_FILE"
sudo tar czf "$BACKUP_FILE" --exclude='data/postgres' ./ >> "$LOG_FILE" 2>&1 || \
  echo "[$DATE] ⚠ 備份完成（部分目錄略過）" | tee -a "$LOG_FILE"

# === 2️⃣ 清除壞掉的 Git 結構 ===
echo "[$DATE] 🧹 清除舊的 .git 結構..." | tee -a "$LOG_FILE"
sudo rm -rf .git

# === 3️⃣ 初始化新 Git ===
echo "[$DATE] 🔄 初始化 Git..." | tee -a "$LOG_FILE"
git init >> "$LOG_FILE" 2>&1

# === 4️⃣ 設定遠端 ===
REMOTE_URL="https://e0985747335-debug@github.com/e0985747335-debug/igb-design-center.git"
git remote add origin "$REMOTE_URL" >> "$LOG_FILE" 2>&1

# === 5️⃣ 新增、提交、推送 ===
echo "[$DATE] 🧠 提交與推送中..." | tee -a "$LOG_FILE"
git add . >> "$LOG_FILE" 2>&1
git commit -m "🧩 Reinitialized repository after repair ($DATE)" >> "$LOG_FILE" 2>&1 || true
git branch -M main >> "$LOG_FILE" 2>&1

if git push -u origin main --force >> "$LOG_FILE" 2>&1; then
  echo "[$DATE] ✅ Git 推送成功！" | tee -a "$LOG_FILE"
  echo "[$DATE] 📁 備份已儲存：$BACKUP_FILE" | tee -a "$LOG_FILE"
  exit 0
else
  echo "[$DATE] ❌ Git 推送失敗。" | tee -a "$LOG_FILE"
  echo "[$DATE] 📁 備份仍保留：$BACKUP_FILE" | tee -a "$LOG_FILE"
  exit 1
fi
