#!/bin/bash
# ==========================================================
# 🧠 Smart Heavy Cleaner v3.9 (for IGB ERP 2.0)
# 作者: IGB Tung
# 功能:
#   ✅ 自動清理大型暫存資料
#   ✅ 偵測 Git 結構損毀
#   ✅ 自動觸發 git-repair.sh
#   ✅ 全程日誌記錄、狀態回傳
# ==========================================================

set -e
cd "$(dirname "$0")/.."
DATE=$(date '+%Y%m%d_%H%M%S')
LOG_DIR="./logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/smart-heavy-cleaner.log"

echo "[$DATE] 🧹 啟動 Smart Heavy Cleaner..." | tee -a "$LOG_FILE"

# === 1️⃣ 清理暫存與快取 ===
echo "[$DATE] 🔧 清理快取與暫存資料..." | tee -a "$LOG_FILE"
sudo rm -rf ./__pycache__ ./tmp ./cache ./dist ./build 2>/dev/null || true

# === 2️⃣ 確認 Git 狀態 ===
if ! git status >> "$LOG_FILE" 2>&1; then
  echo "[$DATE] ⚠ 檢測到 Git 結構異常，啟動修復程序..." | tee -a "$LOG_FILE"
  bash ./tools/git-repair.sh
  RESULT=$?
  if [ $RESULT -eq 0 ]; then
    echo "[$DATE] ✅ Git 修復成功！" | tee -a "$LOG_FILE"
  else
    echo "[$DATE] ❌ Git 修復失敗，請人工檢查！" | tee -a "$LOG_FILE"
  fi
else
  echo "[$DATE] ✅ Git 狀態正常。" | tee -a "$LOG_FILE"
fi

echo "[$DATE] 🌈 Smart Heavy Cleaner 完成！" | tee -a "$LOG_FILE"
