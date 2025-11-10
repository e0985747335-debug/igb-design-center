// =====================================================
// 🧾 Expense Module - 費用申報與核准
// =====================================================

console.log("🧾 Expense module loaded.");

window.initExpenseModule = function() {
    console.log("🧮 初始化費用申報模組...");

    const container = document.getElementById('expense-module-view');
    if (!container) return;

    container.innerHTML = `
        <div class="p-6 bg-white rounded-2xl shadow-md">
            <h2 class="text-xl font-bold mb-4">🧾 費用申報管理</h2>
            <p>這裡可以模擬費用申報、審批、以及自動 GL 拋轉。</p>
            <button id="btn-simulate-expense" class="px-4 py-2 bg-blue-600 text-white rounded">模擬拋轉</button>
        </div>
    `;

    document.getElementById("btn-simulate-expense").onclick = async () => {
        try {
            const res = await fetch("/gl/post", {
                headers: { "Authorization": `Bearer ${localStorage.getItem("jwt_token")}` }
            });
            const data = await res.json();
            alert(`✅ 成功：${data.message}`);
        } catch (err) {
            alert("❌ 拋轉失敗，請檢查 Token 或 API 狀態。");
        }
    };
};
