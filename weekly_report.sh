#!/bin/bash
set -e
cd /home/iven/igb-design-center

REPORT_DIR="reports"
mkdir -p $REPORT_DIR
REPORT_FILE="$REPORT_DIR/weekly_report_$(date '+%Y-%m-%d').md"

echo "# 🧾 IGB ERP 2.0 Weekly Report - $(date '+%Y-%m-%d')" > $REPORT_FILE
echo "" >> $REPORT_FILE
echo "## 📊 Commit 活動摘要" >> $REPORT_FILE
git log --since="7 days ago" --pretty=format:"- %h %s (%cr)" >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "## 📂 修改最多的檔案" >> $REPORT_FILE
git log --since="7 days ago" --name-only | grep -v '^$' | sort | uniq -c | sort -nr | head -10 >> $REPORT_FILE

echo "" >> $REPORT_FILE
echo "## 🧠 系統日誌摘要" >> $REPORT_FILE
tail -n 30 /home/iven/igb-design-center/防白工.log >> $REPORT_FILE

git add $REPORT_FILE
git commit -m "📑 Weekly report $(date '+%Y-%m-%d')"
git push origin main
