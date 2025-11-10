// =====================================================
// 💰 Finance Module - 財務儀表板與總帳拋轉
// =====================================================

console.log("📊 Finance module loaded.");

window.initFinanceModule = function() {
    console.log("📈 初始化財務儀表板...");

    const container = document.getElementById('finance-module-view');
    if (!container) return;

    container.innerHTML = `
        <div class="p-6 bg-white rounded-2xl shadow-md">
            <h2 class="text-xl font-bold mb-4">📊 財務儀表板</h2>
            <p>這裡將顯示總帳摘要、費用統計與損益分析。</p>
        </div>
    `;
};
