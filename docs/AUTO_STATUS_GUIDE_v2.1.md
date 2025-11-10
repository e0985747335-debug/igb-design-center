# 建立 docs 目錄（如不存在）
mkdir -p ~/igb-design-center/docs

# 寫入 AUTO_STATUS_GUIDE_v2.1.md
tee ~/igb-design-center/docs/AUTO_STATUS_GUIDE_v2.1.md > /dev/null <<'EOF'
# 🧠 IGB ERP 2.0 - Git Auto Watcher v2.1
**版本日期**：2025-11-08  
**作者**：IGB Tung  
**用途**：自動監控檔案變更，並在偵測到修改時自動 commit + push 到 GitHub。  

---

## 🚀 一、架構概覽
| 模組 | 檔案路徑 | 功能說明 |
|------|-----------|----------|
| `git-autowatch.service` | `/etc/systemd/system/` | systemd 服務單元，開機自動啟動 |
| `git-autowatch-run.sh` | `tools/` | 實際監控程式，使用 `inotifywait` 偵測檔案變更 |
| `auto-status-sync.sh` | `tools/` | 自動執行 `git add + commit + push` |
| `logs/auto-status-sync.log` | `logs/` | 詳細紀錄每次同步過程 |
| `logs/git-autowatch.log` | `logs/` | 紀錄監控事件（檔案偵測） |
| `.dbus_session_address` | `~` | 儲存通知服務的環境位址（用於 `notify-send`） |

---

## ⚙️ 二、自動化工作流程
1. **啟動階段**
   - systemd 於開機後自動執行 `git-autowatch-run.sh`
   - 程式載入監控目錄：`~/igb-design-center`
2. **監控階段**
   - 當有檔案被修改、建立、刪除或移動時，觸發事件  
   - `git-autowatch-run.sh` 呼叫 `auto-status-sync.sh`
3. **同步階段**
   ```bash
   git add -A
   git commit -m "🧩 Auto-sync @ YYYY-MM-DD_HH:MM:SS"
   git push origin main
若距離上次同步 < 60 秒，將跳過以避免 Git 過載

若 push 成功 → 顯示桌面通知與 log 紀錄

若 push 失敗 → 寫入 log 並顯示錯誤提示

🪶 三、日誌說明
檔案	用途
logs/git-autowatch.log	顯示監控事件，如「🔔 偵測變更」
logs/auto-status-sync.log	顯示 commit 與 push 狀態
.last_auto_sync	記錄上次同步時間（避免頻繁觸發）

🧰 四、常用指令
指令	功能
sudo systemctl status git-autowatch.service	檢查服務狀態
sudo systemctl restart git-autowatch.service	重新啟動監控服務
sudo systemctl stop git-autowatch.service	暫停監控
tail -f logs/git-autowatch.log	實時監控事件
tail -f logs/auto-status-sync.log	監控同步過程

🩺 五、錯誤排查建議
問題	原因	解決方式
❌ Unbalanced quoting	service 檔案引號錯誤	用 setup-git-autowatch-v2.1.sh 重新建立
⚠ 遠端無法連線	無 Git 權限或網路中斷	檢查 git remote -v 與網路連線
💤 無任何同步動作	沒有檔案變更或觸發間隔太短	檢查 .last_auto_sync 時間戳
🔕 無桌面通知	DBUS_SESSION_BUS_ADDRESS 未設定	重新執行 echo $DBUS_SESSION_BUS_ADDRESS > ~/.dbus_session_address

🧩 六、通知整合
若環境有圖形介面，並安裝 notify-send：

bash
複製程式碼
sudo apt install libnotify-bin -y
即可於每次自動推送後顯示通知訊息：

複製程式碼
✅ 已推送至 GitHub
🧭 七、檔案結構範例
arduino
複製程式碼
igb-design-center/
 ├── tools/
 │   ├── auto-status-sync.sh
 │   ├── git-autowatch-run.sh
 │   └── setup-git-autowatch-v2.1.sh
 ├── logs/
 │   ├── git-autowatch.log
 │   ├── auto-status-sync.log
 │   └── .last_auto_sync
 ├── docs/
 │   └── AUTO_STATUS_GUIDE_v2.1.md
 └── ...
🔒 八、安全與最佳實務
使用 個人 access token 或 SSH key 管理遠端權限

建議使用 GitHub 的 fine-grained token (repo push)

若多用戶共用系統，可在 service 內限制執行帳號

📈 九、版本紀錄
版本	日期	變更說明
v1.0	2025-11-05	初版建立，支援基本自動推送
v2.0	2025-11-07	加入 systemd、自動重啟機制
v2.1	2025-11-08	修正 quoting 錯誤、整合通知與時間防重觸發
EOF		


