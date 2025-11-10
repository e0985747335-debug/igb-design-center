// ============================================================
// 🚀 IGB ERP 2.0 Auto Loader + Auto Login (Enterprise Edition)
// ============================================================
// ============================================================
// 🧭 全域模組切換控制器 (Switch Module)
// ============================================================
window.switchModule = function(targetId) {
    console.log("🧩 切換模組 ->", targetId);
    const allModules = document.querySelectorAll(".module-view");
    allModules.forEach(m => m.classList.add("hidden"));
    const target = document.getElementById(targetId);
    if (target) target.classList.remove("hidden");
    else console.warn(`⚠️ 找不到模組區塊: ${targetId}`);
};

async function authenticateUser(username, password) {
    console.log("🔐 嘗試登入中...");
    try {
        const response = await fetch("/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `username=${username}&password=${password}`
        });

        if (!response.ok) throw new Error("登入失敗，請檢查帳號密碼");

        const data = await response.json();
        localStorage.setItem("access_token", data.access_token);
        console.log("✅ 登入成功，Token 已儲存。");

        // 更新 Authorization header 用於後續 API
        window.authHeader = {
            Authorization: `Bearer ${data.access_token}`
        };

    } catch (err) {
        console.error("❌ 登入失敗:", err);
        alert("登入失敗，請檢查 FastAPI 是否啟動中。");
    }
}

// 🧩 模組動態載入
async function loadFrontendModules() {
    const modules = ["finance_module", "expense_mgmt_module", "project_mgmt_module"];
    for (const mod of modules) {
        const path = `/static/components/${mod}.js`;
        try {
            await import(path);
            console.log(`✅ 已載入模組: ${mod}`);
        } catch (e) {
            console.warn(`⚠️ 模組載入失敗: ${mod}`, e);
        }
    }
}

// 🧭 自動登入 + 自動載入模組
document.addEventListener("DOMContentLoaded", async () => {
    console.log("🌐 初始化 IGB ERP 前端模組...");

    // 1️⃣ 自動登入
    await authenticateUser("igb47", "7aciYMUu");

    // 2️⃣ 載入模組
    await loadFrontendModules();

    // 3️⃣ 顯示財務主頁
    if (typeof switchModule === "function") {
        switchModule("finance-module-view");
    }

    // 4️⃣ 啟動自動續期 Token（每 14 分鐘）
    setInterval(async () => {
        console.log("🔁 嘗試自動續期 Token...");
        await authenticateUser("igb47", "7aciYMUu");
    }, 14 * 60 * 1000);
});

// 🧰 公用 API 呼叫封裝（自動帶 JWT Header）
window.apiFetch = async function (url, options = {}) {
    const headers = Object.assign({}, window.authHeader || {}, options.headers || {});
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
        console.warn("⚠️ Token 過期，重新登入中...");
        await authenticateUser("igb47", "7aciYMUu");
        return window.apiFetch(url, options); // retry
    }
    return response.json();
};
