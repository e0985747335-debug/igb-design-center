#!/bin/bash
# ==========================================================
# 🚀 IGB ERP 2.0 - AUTO VERSION & PUSH SYNC
# 功能：
#   - 自動更新 AUTO_STATUS_GUIDE.md 版本標籤
#   - 提交並同步推送至 GitHub
# ==========================================================

cd ~/igb-design-center || exit 1
DATE=$(date '+%Y-%m-%d %H:%M:%S')
VERSION_FILE="AUTO_STATUS_GUIDE.md"

# 取得目前版本號
CURRENT_VER=$(grep -oP 'v[0-9]+\.[0-9]+' "$VERSION_FILE" | head -n 1)
if [ -z "$CURRENT_VER" ]; then
  CURRENT_VER="v1.0"
fi

# 自動遞增版本號（小數點第二位 +1）
BASE_VER=${CURRENT_VER%.*}
MINOR_VER=${CURRENT_VER#*.}
NEW_VER="$BASE_VER.$((MINOR_VER + 1))"

# 更新文件頂部
sed -i "1s/^.*$/# 🧭 AUTO STATUS GUIDE — $NEW_VER ($DATE)/" "$VERSION_FILE"

# 提交與推送
git add "$VERSION_FILE"
git commit -m "📘 Auto update $VERSION_FILE — $NEW_VER ($DATE)"
git push origin main

# 通知提示
notify-send "✅ AUTO STATUS GUIDE 已更新至 $NEW_VER 並推送至 GitHub"
echo "[$DATE] ✅ AUTO STATUS GUIDE 已更新至 $NEW_VER 並推送成功"
