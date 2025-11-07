#!/bin/bash
# ==========================================================
# 🧠 IGB ERP 2.0 Smart Heavy Cleaner v5.0
# 作者: IGB Tung
# 功能:
#   ✅ 自動偵測 >100MB 檔案並移至 ~/.cache/igb-heavy
#   ✅ 自動壓縮專案備份 (tar.gz + SHA256)
#   ✅ 自動 Git 提交、推送
#   ✅ 自動上傳 GitHub Release (需 gh CLI)
# ==========================================================

set -e
cd "$(dirname "$0")/.."   # 確保執行在專案根目錄

# === 初始化參數 ===
HEAVY_CACHE="$HOME/.cache/igb-heavy"
LOG_DIR="./logs"
BACKUP_DIR="./backup"
mkdir -p "$HEAVY_CACHE" "$LOG_DIR" "$BACKUP_DIR"
LOG_FILE="$LOG_DIR/smart-heavy-cleaner.log"
DATE=$(date '+%Y-%m-%d_%H-%M-%S')

RELEASE_NAME="AutoBackup-$DATE"
RELEASE_TAG="backup-$DATE"
BACKUP_FILE="$BACKUP_DIR/igb-design-center-$DATE.tar.gz"
SHA_FILE="$BACKUP_FILE.sha256"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🚀 Smart Heavy Cleaner v5.0 啟動..." | tee -a "$LOG_FILE"

# === 偵測並搬移大檔 ===
find . -type f -size +100M 2>/dev/null | while read -r FILE; do
    TARGET="$HEAVY_CACHE$(dirname "$FILE" | sed 's|^\./||')"
    mkdir -p "$TARGET"
    echo "[$(date '+%H:%M:%S')] ⚙ 偵測大檔案: $FILE" | tee -a "$LOG_FILE"

    mv "$FILE" "$TARGET/" 2>/dev/null || {
        echo "[$(date '+%H:%M:%S')] ❌ 搬移失敗: $FILE" | tee -a "$LOG_FILE"
        continue
    }

    PLACEHOLDER=$(basename "$FILE")
    echo "(moved to $HEAVY_CACHE)" > "$FILE"
    echo "[$(date '+%H:%M:%S')] ✅ 已搬移至: $TARGET/$PLACEHOLDER" | tee -a "$LOG_FILE"
done

# === Git 清理 ===
git rm -r --cached . >/dev/null 2>&1 || true
git add . >/dev/null 2>&1
git commit -m "🧹 Auto-clean large files & prepare backup ($DATE)" >/dev/null 2>&1 || \
    echo "[$(date '+%H:%M:%S')] ℹ 無需提交 (無變更)" | tee -a "$LOG_FILE"

# === 專案壓縮備份 ===
echo "[$(date '+%H:%M:%S')] 📦 壓縮專案中..." | tee -a "$LOG_FILE"
tar czf "$BACKUP_FILE" --exclude='./data/postgres' --exclude='./yes' . >/dev/null 2>&1
sha256sum "$BACKUP_FILE" > "$SHA_FILE"

echo "[$(date '+%H:%M:%S')] ✅ 備份完成: $BACKUP_FILE" | tee -a "$LOG_FILE"
echo "[$(date '+%H:%M:%S')] 🔐 SHA256: $(cat "$SHA_FILE")" | tee -a "$LOG_FILE"

# === 推送至 GitHub ===
echo "[$(date '+%H:%M:%S')] 🚀 正在推送至 GitHub..." | tee -a "$LOG_FILE"
git push origin main --force >/dev/null 2>&1 && \
echo "[$(date '+%H:%M:%S')] ✅ GitHub 同步成功！" | tee -a "$LOG_FILE"

# === GitHub Release 上傳 ===
if command -v gh >/dev/null 2>&1; then
    echo "[$(date '+%H:%M:%S')] 🌐 建立 GitHub Release..." | tee -a "$LOG_FILE"
    gh release create "$RELEASE_TAG" "$BACKUP_FILE" "$SHA_FILE" \
        --title "$RELEASE_NAME" \
        --notes "Auto backup created on $DATE by Smart Heavy Cleaner v5.0" \
        >/dev/null 2>&1 && \
        echo "[$(date '+%H:%M:%S')] ✅ Release 已建立！" | tee -a "$LOG_FILE"
else
    echo "[$(date '+%H:%M:%S')] ⚠️ 未安裝 GitHub CLI，略過 release。" | tee -a "$LOG_FILE"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Smart Heavy Cleaner v5.0 全流程完成！" | tee -a "$LOG_FILE"
