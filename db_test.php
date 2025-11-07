<?php
// 此檔案用於單獨測試您的 WordPress 資料庫連線設定。
// 請將此檔案上傳到您的 WordPress 根目錄後執行 (例如: 你的網址/db_test.php)。

// *** 警告：請在此處輸入您 wp-config.php 中的資料庫連線資訊！ ***
$servername = "localhost"; // DB_HOST
$username = "igb47.eu.org"; // DB_USER
$password = ".///7aciYMUu"; // DB_PASSWORD
$dbname = "wordpress_db"; // DB_NAME
// ***************************************************************

// 檢查是否所有變數都已替換為實際值
if ($username === "your_db_username" || $password === "your_strong_password" || $dbname === "your_database_name") {
    echo "<h1>❌ 連線失敗 (請先填入資料庫資訊)</h1>";
    echo "<p>請編輯 <code>db_test.php</code> 檔案，將 \$username, \$password 和 \$dbname 替換為 <code>wp-config.php</code> 中的實際值。</p>";
    exit();
}

// 嘗試建立 MySQL 連線
$conn = new mysqli($servername, $username, $password, $dbname);

// 檢查連線是否成功
if ($conn->connect_error) {
    echo "<h1>❌ 資料庫連線失敗！</h1>";
    echo "<p><strong>錯誤訊息:</strong> " . $conn->connect_error . "</p>";
    echo "<p>這確認了您的 <code>wp-config.php</code> 中的連線參數有誤，或者資料庫伺服器未運行。</p>";
    echo "<h2>請檢查：</h2>";
    echo "<ul>";
    echo "<li><strong>DB_USER:</strong> 使用者名稱是否正確？</li>";
    echo "<li><strong>DB_PASSWORD:</strong> 密碼是否正確？</li>";
    echo "<li><strong>DB_HOST:</strong> 主機位址 (<code>$servername</code>) 是否正確？</li>";
    echo "<li><strong>主機狀態：</strong> 請聯繫您的主機商確認資料庫服務器是否正在運行。</li>";
    echo "</ul>";
} else {
    echo "<h1>✅ 資料庫連線成功！</h1>";
    echo "<p>這表示您的 <code>wp-config.php</code> 中的連線參數是正確的。</p>";
    echo "<p>如果 WordPress 仍然顯示錯誤，問題可能出在 WordPress 的核心文件損壞或外掛/佈景主題的衝突。</p>";
    echo "<h2>建議的下一步：</h2>";
    echo "<ul>";
    echo "<li>將所有外掛資料夾暫時重新命名 (透過 FTP)，測試是否能進入後台。</li>";
    echo "<li>重新下載並上傳一套全新的 WordPress 核心檔案 (wp-admin 和 wp-includes 資料夾)。</li>";
    echo "</ul>";
    $conn->close();
}

// 提醒：測試完成後，請務必刪除此檔案 (db_test.php)，以確保安全。
?>
