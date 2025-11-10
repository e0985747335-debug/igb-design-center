// ===============================================================
// 🚀 費用申報邏輯 (Expense Management Logic)
// ===============================================================

// ✅ 初始化大項／細項選單
window.renderCategorySelects = function() {
    const majorSelect = document.getElementById('expense-major');
    const minorSelect = document.getElementById('expense-minor');

    if (!majorSelect || !minorSelect) return;

    // 渲染大項 (Major Category)
    majorSelect.innerHTML = '<option value="" disabled selected>請選擇費用大項</option>';
    expenseCategories.forEach((cat, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = cat.title;
        majorSelect.appendChild(option);
    });
    majorSelect.disabled = false;

    // 處理大項選擇變更，以渲染細項 (Minor Category)
    majorSelect.onchange = (e) => {
        const selectedIndex = parseInt(e.target.value);
        const minorCats = expenseCategories[selectedIndex].subItems;

        minorSelect.innerHTML = '<option value="" disabled selected>請選擇費用細目</option>';
        minorCats.forEach(minor => {
            const option = document.createElement('option');
            option.value = minor;
            option.textContent = minor;
            minorSelect.appendChild(option);
        });
        minorSelect.disabled = false;
    };

    minorSelect.disabled = true;
};

// ✅ 專案選單渲染
window.renderProjectSelect = function(selectElementId = 'expense-project', currentProjectId = null) {
    const projectSelect = document.getElementById(selectElementId);
    if (!projectSelect) return;

    projectSelect.innerHTML = '';
    mockProjectsData.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = `${project.id} - ${project.name.replace(/ *\([^)]*\) */g, "")}`;
        if (project.id === 'OPEX-GEN' || project.id === currentProjectId) {
            option.selected = true;
        }
        projectSelect.appendChild(option);
    });
};

// ✅ 單筆費用提交
window.handleSingleExpenseSubmit = function(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const majorIndex = formData.get('major-category');
    const minorCategory = formData.get('minor-category');
    const projectId = formData.get('project-id');
    const amount = parseFloat(formData.get('amount'));

    if (!form.checkValidity() || projectId === "" || isNaN(amount) || amount <= 0) {
        form.reportValidity();
        showMessageBox("錯誤", '請確保所有必填欄位都已填寫且金額有效。', true);
        return;
    }

    const majorCategoryTitle = expenseCategories[majorIndex].title;
    const newId = mockClaims.reduce((max, c) => Math.max(max, c.id), 1000) + 1;

    const newClaim = {
        id: newId,
        title: `${minorCategory}`,
        total: amount,
        submitDate: new Date().toISOString().slice(0, 10),
        status: 'Pending', // 🚀 關鍵修正
        projectCode: projectId,
        accountCode: minorCategory,
        purpose: formData.get('description') || '無詳細說明',
        claimer: "王小明",
        department: "業務發展部",
        details: [`${majorCategoryTitle} / ${minorCategory}: ${formData.get('currency')} ${amount}`],
        approver: "陳經理"
    };

    mockClaims.push(newClaim);
    showMessageBox("提交成功", `📣 報銷單 EXP-${newId} 已提交審批，請等待經理處理。`);

    form.reset();
    renderCategorySelects();
    window.switchExpenseSubView('claimer');
};

// ✅ 審批 (含 GL 拋轉)
window.handleApproval = async function(id, newStatus) {
    const claimIndex = mockClaims.findIndex(c => c.id === id);
    if (claimIndex === -1) return;

    const claim = mockClaims[claimIndex];

    try {
        if (newStatus === 'Approved') {
            showMessageBox("拋轉中", `🔄 申報單 EXP-${id} 正在拋轉總帳...`);

            if (!window.postToGeneralLedger) {
                throw new Error("GL Service Not Found. 請檢查 expense.gl.service.js 導入。");
            }

            await window.postToGeneralLedger(claim);
            claim.status = 'Approved';
            showMessageBox("核准成功", `✅ 申報單 EXP-${id} 已核准！費用分錄已拋轉至總帳。`);

        } else if (newStatus === 'Rejected') {
            claim.status = 'Rejected';
            showMessageBox("拒絕成功", `❌ 申報單 EXP-${id} 已被拒絕。`);
        }

        window.backToExpenseMgmt();
    } catch (e) {
        console.error("GL 拋轉失敗:", e);
        showMessageBox("錯誤", `❌ 拋轉失敗：${e.message || '無法連線到後端服務。'}`, true);
    }
};

// ✅ 開啟報銷詳情
window.openClaimDetail = function(id, role) {
    const claim = mockClaims.find(c => c.id === id);
    if (!claim) {
        showMessageBox('錯誤', '找不到該申報單。', true);
        return;
    }

    currentEditingClaimId = id;
    document.getElementById('claimer-content').classList.add('hidden');
    document.getElementById('approver-content').classList.add('hidden');
    document.getElementById('expense-detail-view').classList.remove('hidden');
};
