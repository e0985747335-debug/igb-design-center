// frontend/components/approval.js
// IGB ERP 2.0：費用審批模組 (GL 拋轉測試)

export async function initApprovalModule() {
    const container = document.createElement('div');
    container.className = 'p-6 bg-white rounded-2xl shadow-md max-w-xl mx-auto mt-12';
    container.innerHTML = `
        <h2 class="text-xl font-semibold mb-4 text-gray-800">💼 費用審批模組</h2>
        <p class="text-gray-600 mb-4">模擬財務主管批准一筆費用申請，系統將觸發 GL 拋轉流程。</p>
        <button id="approveBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition-all">
            ✅ 批准
        </button>
        <div id="approvalResult" class="mt-4 text-gray-700 font-medium"></div>
    `;
    document.body.appendChild(container);

    const approveBtn = document.getElementById('approveBtn');
    const resultBox = document.getElementById('approvalResult');

    approveBtn.addEventListener('click', async () => {
        approveBtn.disabled = true;
        approveBtn.textContent = '⏳ 處理中...';
        resultBox.textContent = '';

        const token = localStorage.getItem('access_token');
        if (!token) {
            resultBox.innerHTML = '<span class="text-red-600">尚未登入，請先執行登入動作。</span>';
            approveBtn.disabled = false;
            approveBtn.textContent = '✅ 批准';
            return;
        }

        try {
            const res = await fetch('/gl/post', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            resultBox.innerHTML = `
                <span class="text-green-700">✅ ${data.message}</span><br>
                操作者：<strong>${data.operator}</strong>
            `;
        } catch (err) {
            resultBox.innerHTML = `<span class="text-red-600">❌ 拋轉失敗：${err.message}</span>`;
        } finally {
            approveBtn.disabled = false;
            approveBtn.textContent = '✅ 批准';
        }
    });
}
