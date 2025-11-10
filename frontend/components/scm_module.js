// =====================================================
// 🏭 SCM Module - 採購與供應鏈自動化
// =====================================================

console.log("🏭 SCM module loaded.");

window.initSCMModule = function() {
    console.log("🚚 初始化 SCM 模組...");

    const container = document.getElementById('scm-module-view');
    if (!container) return;

    container.innerHTML = `
        <div class="p-6 bg-white rounded-2xl shadow-md">
            <h2 class="text-xl font-bold mb-4">🏭 供應鏈與採購</h2>
            <p>供應商付款、RMA 流程與採購單狀態將在此顯示。</p>
        </div>
    `;
};
