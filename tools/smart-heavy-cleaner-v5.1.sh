#!/bin/bash
# ==========================================================
# 🧹 IGB ERP 2.0 Smart Heavy Cleaner v3.9 (含 Git Repair 自動重試)
# 作者: IGB Tung
# 功能:
#   ✅ 系統與 Docker 清理
#   ✅ 自動偵測並執行 git-repair.sh
#   ✅ 若推送失敗自動重試 3 次
#   ✅ 桌面通知 + 日誌記錄 + Cron 兼容
# ==========================================================

set -e
cd "$(dirname "$0")/.."   # 回到專案根目錄
DATE=$(date '+%Y%m%d_%H%M%S')
LOG_DIR="./logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/smart-heavy-cleaner.log"

# === 桌面通知 ===
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

echo "[$DATE] 🚀 開始執行 Smart Heavy Cleaner..." | tee -a "$LOG_FILE"

# === 1️⃣ 系統清理 ===
echo "[$DATE] 🧹 清理暫存與快取..." | tee -a "$LOG_FILE"
sudo rm -rf ./__pycache__ ./tmp ./cache ./logs/*.old ./node_modules/.cache >> "$LOG_FILE" 2>&1 || true
sudo docker system prune -af >> "$LOG_FILE" 2>&1 || true
sudo apt-get autoremove -y >> "$LOG_FILE" 2>&1 || true

# === 2️⃣ Node / Python 清理 ===
echo "[$DATE] 🧠 清理 Node / Python 環境..." | tee -a "$LOG_FILE"
sudo rm -rf ~/.npm/_logs ~/.cache/pip >> "$LOG_FILE" 2>&1 || true

# === 3️⃣ Git 修復模組 (自動重試推送) ===
if [ -f "./tools/git-repair.sh" ]; then
  echo "[$DATE] 🧩 偵測到 git-repair.sh，開始執行..." | tee -a "$LOG_FILE"
  bash ./tools/git-repair.sh >> "$LOG_FILE" 2>&1

  # === 檢查推送狀態 ===
  ATTEMPT=1
  MAX_RETRY=3
  SUCCESS=false

  while [ $ATTEMPT -le $MAX_RETRY ]; do
    echo "[$DATE] ☁ 嘗試第 $ATTEMPT 次推送..." | tee -a "$LOG_FILE"
    git add . >> "$LOG_FILE" 2>&1
    git commit -m "🔁 Auto Push Retry #$ATTEMPT" >> "$LOG_FILE" 2>&1 || true
    git push origin main >> "$LOG_FILE" 2>&1 && SUCCESS=true && break
    echo "[$DATE] ⚠ 推送失敗，第 $ATTEMPT 次重試中..." | tee -a "$LOG_FILE"
    sleep 15
    ATTEMPT=$((ATTEMPT + 1))
  done

  if [ "$SUCCESS" = true ]; then
    echo "[$DATE] ✅ GitHub 推送成功！" | tee -a "$LOG_FILE"
    notify "IGB ERP 自動推送成功" "GitHub 已同步完成 ✅"
  else
    echo "[$DATE] ❌ 推送 3 次皆失敗，請檢查網路或 Token。" | tee -a "$LOG_FILE"
    notify "⚠ IGB ERP 推送失敗" "請手動檢查 Git 狀態。"
  fi

else
  echo "[$DATE] ⚠ 找不到 ./tools/git-repair.sh，跳過 Git 修復步驟" | tee -a "$LOG_FILE"
fi

# === 4️⃣ 結束階段 ===
echo "[$DATE] ✅ 清理與推送流程完成！" | tee -a "$LOG_FILE"
notify "IGB ERP 清理完成" "系統清理 + Git 修復已完成。"
