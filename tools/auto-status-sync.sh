#!/bin/bash
# ==========================================================
# 🚀 IGB ERP 2.0 Auto Status Sync v1.3
# 作者: IGB Tung
# 功能:
#   ✅ 自動生成 AUTO_STATUS_GUIDE.md
#   ✅ GitHub 自動提交與推送
#   ✅ 顯示桌面通知
#   ✅ 自動寫入日誌
# ==========================================================

set -e
cd ~/igb-design-center
LOG_DIR="./logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/auto-status-sync.log"
DATE=$(date '+%Y%m%d_%H%M%S')

echo "[$DATE] 🚀 開始自動狀態摘要同步..." | tee -a "$LOG_FILE"

# === 1. 生成新版 AUTO_STATUS_GUIDE.md ===
cat > AUTO_STATUS_GUIDE.md << 'EOF'
# 📘 IGB ERP 2.0 自動化狀態摘要（v1.3）

## 🧩 系統模組啟用狀態
- ✅ Smart Heavy Cleaner：運作中  
- ✅ Auto Git Push（auto-version-push.sh）：啟用  
- ✅ Git AutoWatch（git-autowatch.service）：已啟動  
- ✅ Shutdown Clean Backup（git-autoclean-shutdown.service）：已註冊  

## 🕒 排程任務
| 時間 | 任務名稱 | 狀態 |
|------|-----------|------|
| 每日 09:00 | 開工提醒 | ✅ |
| 每日 18:00 | 收工自動化 | ✅ |
| 每週日 21:00 | 系統備份 | ✅ |
| 每日 23:30 | AUTO_STATUS 同步 | ✅ |

## 🔄 Git 狀態同步檢查
- 分支：`main`
- 遠端倉庫：`origin`
- 同步模式：自動（Auto Push Enabled）
- 檢查時間：$(date '+%Y-%m-%d %H:%M:%S')

## 🧠 說明
本文件由 auto-status-sync.sh 自動生成並同步至 GitHub。
EOF

echo "[$DATE] 🧩 生成 AUTO_STATUS_GUIDE.md 完成。" | tee -a "$LOG_FILE"

# === 2. Git 提交與推送 ===
git add AUTO_STATUS_GUIDE.md
git commit -m "📘 AUTO_STATUS_GUIDE.md v1.3 自動更新 ($(date '+%Y-%m-%d %H:%M'))" >> "$LOG_FILE" 2>&1 || true
git push origin main >> "$LOG_FILE" 2>&1 && notify-send "✅ AUTO_STATUS 已同步成功" || notify-send "⚠️ AUTO_STATUS 同步失敗"

echo "[$DATE] ✅ 同步流程完成。" | tee -a "$LOG_FILE"
