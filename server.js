// server.js - Express 伺服器配置，用於託管 React/Vite 前端應用程式
// 修正了 PathError [TypeError]: Missing parameter name at index 1: * 的問題。

const express = require('express');
const path = require('path');
const app = express();
// 假設您在 package.json 中將埠號設定為 3000
const port = process.env.PORT || 3000;

// ===================================================================
// 步驟 1: 設定靜態檔案路徑 (已確認使用 'dist')
// ===================================================================
const frontendPath = path.join(__dirname, 'dist');
app.use(express.static(frontendPath));

// ===================================================================
// 步驟 2: 設定 API 根路徑 (可選，但保持清晰)
// 如果用戶訪問 '/', Express.static 應該會提供 index.html。
// 這個路由可以作為一個明確的入口點或健康檢查點。
// ===================================================================
app.get('/', (req, res) => {
    // 確保總是提供 React 的入口點 index.html
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// ===================================================================
// 步驟 3: 處理前端路由回退 (使用 app.use 替代 app.get('*'))
// 這是解決 PathError 的關鍵步驟。
// app.use 可以在沒有明確路徑匹配時作為最終的回退層。
// ===================================================================
app.use((req, res, next) => {
    // 這裡我們假設所有非靜態檔案請求都應該導向 index.html
    // 讓 React Router 在前端處理路由，除非它是 API 呼叫。

    // 可選：如果你希望明確處理 API 404
    if (req.path.startsWith('/api')) {
         return res.status(404).json({ message: 'API 資源未找到' });
    }
    
    // 對於所有未匹配的 GET 請求，提供 React 的入口點
    // 這樣 React Router 就能接管並處理像 /dashboard 這樣的路徑
    if (req.method === 'GET') {
        res.sendFile(path.join(frontendPath, 'index.html'));
    } else {
        // 對於 POST/PUT/DELETE 等請求，如果沒有其他路由處理，則繼續
        next();
    }
});


// 啟動伺服器
app.listen(port, () => {
    console.log(`伺服器已啟動，正在監聽埠號 ${port}`);
    console.log(`請在瀏覽器中開啟: http://localhost:${port}`);
});
