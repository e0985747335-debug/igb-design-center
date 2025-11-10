// =====================================================
// 🏗️ Project Management Module - 專案管理與成本追蹤
// =====================================================

console.log("🏗️ Project Management module loaded.");

window.initProjectMgmtModule = function() {
    console.log("📋 初始化專案管理模組...");

    const container = document.getElementById('project-mgmt-module-view');
    if (!container) return;

    container.innerHTML = `
        <div class="p-6 bg-white rounded-2xl shadow-md">
            <h2 class="text-xl font-bold mb-4">🏗️ 專案管理</h2>
            <p>這裡將顯示專案清單、預算執行情況與里程碑。</p>
        </div>
    `;
};
