#!/bin/bash
# ==========================================================
# 🧠 IGB ERP 2.0 Smart Heavy Cleaner v5.3
# 作者: IGB Tung
# 功能:
#   ✅ 自動偵測 >100MB 的檔案
#   ✅ 搬移至 ~/.cache/igb-heavy/
#   ✅ 自動壓縮專案為 backup 檔案
#   ✅ 更新 .gitignore
#   ✅ 自動 Git commit + push
#   ✅ 結尾提示結果與通知
# ==========================================================

set -e
cd "$(dirname "$0")/.."   # 移動到專案根目錄

DATE=$(date '+%Y-%m-%d_%H-%M-%S')
LOG_DIR="./logs"
HEAVY_CACHE="$HOME/.cache/igb-heavy"
BACKUP_DIR="./backup"
LOG_FILE="$LOG_DIR/smart-heavy-cleaner-$DATE.log"

mkdir -p "$LOG_DIR" "$HEAVY_CACHE" "$BACKUP_DIR"

echo "[$(date '+%H:%M:%S')] 🚀 Smart Heavy Cleaner v5.3 啟動..." | tee -a "$LOG_FILE"

# === Step 1: 搬移大於 100MB 的檔案 ===
find . -type f -size +100M 2>/dev/null | while read -r FILE; do
    TARGET="$HEAVY_CACHE$(dirname "$FILE" | sed 's|^\./||')"
    mkdir -p "$TARGET"
    echo "[$(date '+%H:%M:%S')] ⚙ 偵測大檔案: $FILE" | tee -a "$LOG_FILE"
    mv "$FILE" "$TARGET/" 2>/dev/null || {
        echo "[$(date '+%H:%M:%S')] ❌ 搬移失敗: $FILE" | tee -a "$LOG_FILE"
        continue
    }
    echo "(moved to $HEAVY_CACHE)" > "$FILE"
    echo "[$(date '+%H:%M:%S')] ✅ 已搬移至: $TARGET/$(basename "$FILE")" | tee -a "$LOG_FILE"
done

# === Step 2: 更新 .gitignore ===
cat > .gitignore << 'EOF'
# === Docker volumes / DB / cache ===
/data/
/yes/
/pgdata/
/postgres/
/caddy/data/
/caddy/config/
/logs/
/mnt/
/var/
/backup/

# === Python ===
__pycache__/
*.pyc
.venv/
venv/
.env

# === Node / Frontend ===
node_modules/
dist/
build/

# === Archives ===
*.tar.gz
EOF

echo "[$(date '+%H:%M:%S')] 🧾 .gitignore 已更新。" | tee -a "$LOG_FILE"

# === Step 3: 壓縮專案 ===
BACKUP_FILE="$BACKUP_DIR/igb-design-center-$DATE.tar.gz"
echo "[$(date '+%H:%M:%S')] 📦 壓縮專案中..." | tee -a "$LOG_FILE"
tar --exclude='./backup' --exclude='./.git' --exclude='./yes' --exclude='./data' \
    -czf "$BACKUP_FILE" . 2>>"$LOG_FILE"
echo "[$(date '+%H:%M:%S')] ✅ 壓縮完成: $BACKUP_FILE" | tee -a "$LOG_FILE"

# === Step 4: Git commit + push ===
echo "[$(date '+%H:%M:%S')] 🔄 提交並推送至 GitHub..." | tee -a "$LOG_FILE"
git add . >/dev/null 2>&1
git commit -m "🧹 Auto-clean + backup @ $DATE" >/dev/null 2>&1 || echo "[$(date '+%H:%M:%S')] ℹ 無變更可提交" | tee -a "$LOG_FILE"
if git push origin main --force >/dev/null 2>&1; then
    echo "[$(date '+%H:%M:%S')] ✅ GitHub 同步成功！" | tee -a "$LOG_FILE"
else
    echo "[$(date '+%H:%M:%S')] ⚠ GitHub 推送失敗，請手動檢查。" | tee -a "$LOG_FILE"
fi

# === Step 5: 完成通知 ===
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Smart Heavy Cleaner v5.3 完成！" | tee -a "$LOG_FILE"
