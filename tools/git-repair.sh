#!/bin/bash
# ==========================================================
# 🧠 IGB ERP 2.0 Smart Git Repair v3.3 (桌面通知版)
# 作者: IGB Tung
# 功能:
#   ✅ 自動備份專案 (排除 data/postgres)
#   ✅ 清除損毀的 .git 結構
#   ✅ 重新初始化 Git 並重設遠端
#   ✅ 使用 gh auth 推送
#   ✅ 桌面通知 (支援 Linux/macOS)
# ==========================================================

set -e
cd "$(dirname "$0")/.."   # 確保執行於專案根目錄
DATE=$(date '+%Y%m%d_%H%M%S')
LOG_DIR="./logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/git-repair.log"
BACKUP_FILE=~/igb-design-center-repair-backup-$DATE.tar.gz
REPO_URL="https://github.com/e0985747335-debug/igb-design-center.git"

# 🧩 桌面通知工具（支援 Linux/macOS）
notify() {
  local title="$1"
  local msg="$2"
  if command -v notify-send &>/dev/null; then
    notify-send "$title" "$msg"
  elif command -v osascript &>/dev/null; then
    osascript -e "display notification \"$msg\" with title \"$title\""
  else
    echo "🔔 [$title] $msg"
  fi
}

echo "[$DATE] 🚀 開始 Git 修復流程..." | tee -a "$LOG_FILE"

# === 1️⃣ 備份專案 ===
echo "[$DATE] 📦 備份專案 (排除 data/postgres)..." | tee -a "$LOG_FILE"
tar czf "$BACKUP_FILE" --exclude='data/postgres' ./ >> "$LOG_FILE" 2>&1 || \
  echo "[$DATE] ⚠ 備份完成（部分目錄略過）" | tee -a "$LOG_FILE"

# === 2️⃣ 移除舊的 Git 結構 ===
echo "[$DATE] 🧹 清除舊的 .git..." | tee -a "$LOG_FILE"
rm -rf .git

# === 3️⃣ 初始化新 Git ===
echo "[$DATE] 🔄 初始化新的 Git 結構..." | tee -a "$LOG_FILE"
git init >> "$LOG_FILE" 2>&1
git remote add origin "$REPO_URL"

# === 4️⃣ 提交所有檔案 ===
git add .
git commit -m "🧩 Reinitialized repository after corruption repair ($DATE)" >> "$LOG_FILE" 2>&1 || \
  echo "[$DATE] ℹ 無需提交" | tee -a "$LOG_FILE"

# === 5️⃣ 強制推送（使用 gh CLI 認證）===
echo "[$DATE] ☁ 推送至 GitHub..." | tee -a "$LOG_FILE"
git branch -M main
if gh auth status >> "$LOG_FILE" 2>&1; then
  if git push -f origin main >> "$LOG_FILE" 2>&1; then
    echo "[$DATE] ✅ GitHub 推送成功！" | tee -a "$LOG_FILE"
    notify "IGB Git 修復完成" "✅ 推送成功！備份於 $BACKUP_FILE"
  else
    echo "[$DATE] ⚠ GitHub 推送失敗，請手動檢查。" | tee -a "$LOG_FILE"
    notify "IGB Git 修復警告" "⚠ 推送失敗，請檢查網路或 Token"
  fi
else
  echo "[$DATE] ❌ GitHub CLI 尚未登入" | tee -a "$LOG_FILE"
  notify "IGB Git 修復錯誤" "❌ 尚未登入 gh auth"
fi

echo "[$DATE] 🎯 Git 修復完成，備份已儲存於: $BACKUP_FILE" | tee -a "$LOG_FILE"
