import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Firebase 服務引入
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy, where } from 'firebase/firestore';


// =========================================================================
// 常數與輔助組件
// =========================================================================

// 費用類別選項
const CATEGORIES = [
  { value: '', label: '請選擇類別' },
  { value: 'Travel', label: '差旅費' },
  { value: 'Meals', label: '餐飲費' },
  { value: 'Supplies', label: '辦公用品' },
  { value: 'Software', label: '軟體訂閱' },
  { value: 'Other', label: '其他費用' },
];

const STATUS_MAP = {
  Pending: '待審核',
  Approved: '已批准',
  Rejected: '已拒絕',
};

// 狀態選項 (包含一個預設的 "全部")
const STATUS_OPTIONS = [
    { value: 'All', label: '全部狀態' },
    ...Object.keys(STATUS_MAP).map(key => ({
        value: key,
        label: STATUS_MAP[key]
    }))
];

const StatusBadge = ({ status }) => {
  let color = '';
  switch (status) {
    case 'Approved':
      color = 'bg-green-100 text-green-800';
      break;
    case 'Rejected':
      color = 'bg-red-100 text-red-800';
      break;
    case 'Pending':
    default:
      color = 'bg-yellow-100 text-yellow-800';
      break;
  }
  return (
    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>
      {STATUS_MAP[status] || status}
    </span>
  );
};


// =========================================================================
// 主應用程式組件
// =========================================================================

const App = () => {
  // === 狀態管理 ===
  const [expenses, setExpenses] = useState([]);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 表單相關狀態
  const initialFormData = {
    date: new Date().toISOString().substring(0, 10), // 預設今天日期
    category: '',
    amount: '',
    description: '',
    status: 'Pending',
  };
  const [formData, setFormData] = useState(initialFormData);
  const [isEditing, setIsEditing] = useState(false);
  const [currentExpenseId, setCurrentExpenseId] = useState(null);

  // 篩選相關狀態
  const [filters, setFilters] = useState({
      category: 'All',
      status: 'All',
  });

  // === Firebase 初始化與身份驗證 ===

  useEffect(() => {
    // 從 Canvas 環境取得全域變數
    const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';
    const firebaseConfig = typeof window.__firebase_config !== 'undefined' ? JSON.parse(window.__firebase_config) : null;
    const initialAuthToken = typeof window.__initial_auth_token !== 'undefined' ? window.__initial_auth_token : null;

    if (!firebaseConfig) {
      setError("錯誤: 缺少 Firebase 配置，請檢查環境變數。");
      setIsLoading(false);
      return;
    }

    try {
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const authInstance = getAuth(app);
      
      // 設置狀態
      setDb(firestore);
      setAuth(authInstance);

      // 1. 設置身份驗證狀態監聽
      const unsubscribeAuth = onAuthStateChanged(authInstance, (user) => {
        setIsAuthReady(true);
        if (user) {
          setUserId(user.uid);
          console.log("Firebase Auth Ready. UID:", user.uid);
        } else {
          setUserId(null);
          console.log("Firebase Auth Ready. User is signed out.");
        }
        setIsLoading(false);
      });

      // 2. 嘗試登入
      const signIn = async () => {
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(authInstance, initialAuthToken);
          } else {
            await signInAnonymously(authInstance);
          }
        } catch (e) {
          console.error("Firebase Sign In Error:", e);
          setError(`登入失敗: ${e.code}`);
        }
      };

      signIn();
      return () => unsubscribeAuth(); // 清理函數
    } catch (e) {
      console.error("Firebase Initialization Error:", e);
      setError("Firebase 初始化失敗。");
      setIsLoading(false);
    }
  }, []); // 僅在組件掛載時運行一次

  // 獲取 Firestore Collection 路徑
  const getCollectionPath = useCallback(() => {
    // 遵循強制規則: /artifacts/{appId}/users/{userId}/{your_collection_name}
    const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';
    if (userId) {
      return `artifacts/${appId}/users/${userId}/expenses`;
    }
    // 雖然不推薦，但在未登入時返回一個公共路徑以避免應用程式崩潰
    return `artifacts/${appId}/public/data/expenses_public`; 
  }, [userId]);

  // === 實時資料監聽 (onSnapshot) ===

  useEffect(() => {
    // 只有當 db 和 userId 都準備好時才開始監聽
    if (!db || !userId || !isAuthReady) return;

    const path = getCollectionPath();
    const expensesCollection = collection(db, path);
    // 設置查詢：按日期降序排列
    const q = query(expensesCollection, orderBy("date", "desc"));

    // 設置實時監聽器
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedExpenses = [];
      snapshot.forEach((doc) => {
        loadedExpenses.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setExpenses(loadedExpenses);
    }, (err) => {
      console.error("Firestore Error:", err);
      setError("資料載入失敗，請檢查權限或連線。");
    });

    return () => unsubscribe(); // 清理函數，在組件卸載或 userId 改變時停止監聽
  }, [db, userId, isAuthReady, getCollectionPath]);

  // === 表單處理函數 ===

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const { date, category, amount } = formData;
    if (!date || !category || !amount || parseFloat(amount) <= 0) {
      console.error("請填寫所有必填欄位：日期、類別和有效的金額。");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || !userId) return;

    const expenseData = {
      ...formData,
      amount: parseFloat(formData.amount), // 確保金額是數字類型
      createdAt: Date.now(),
    };

    try {
      const path = getCollectionPath();
      if (isEditing && currentExpenseId) {
        // 更新模式
        const expenseRef = doc(db, path, currentExpenseId);
        await updateDoc(expenseRef, expenseData);
        console.log("費用記錄更新成功！");
      } else {
        // 新增模式
        await addDoc(collection(db, path), expenseData);
        console.log("費用記錄新增成功！");
      }
      
      // 重置表單狀態
      setFormData(initialFormData);
      setIsEditing(false);
      setCurrentExpenseId(null);

    } catch (e) {
      console.error("提交失敗:", e);
      console.error(`提交失敗: ${e.message}`);
    }
  };

  // === CRUD 操作函數 ===
  
  const handleEdit = (expense) => {
    setFormData({
      date: expense.date,
      category: expense.category,
      amount: expense.amount.toString(), // 轉回字串以填入輸入框
      description: expense.description,
      status: expense.status,
    });
    setIsEditing(true);
    setCurrentExpenseId(expense.id);
    // 滾動到表單以便編輯
    document.getElementById('expense-form-card').scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    // 由於禁用 window.confirm，我們將使用控制台提示並直接執行刪除
    console.warn("執行刪除操作。請注意：此環境中無法使用 window.confirm 進行二次確認。");

    if (!userId) return;

    try {
      const path = getCollectionPath();
      await deleteDoc(doc(db, path, id));
      console.log("費用記錄刪除成功！");
    } catch (e) {
      console.error("刪除失敗:", e);
      console.error(`刪除失敗: ${e.message}`);
    }
  };
  
  const handleCancelEdit = () => {
    setFormData(initialFormData);
    setIsEditing(false);
    setCurrentExpenseId(null);
  };
  
  // === 篩選與計算邏輯 (使用 useMemo 確保性能) ===
  
  const filteredExpenses = useMemo(() => {
    const { category: filterCategory, status: filterStatus } = filters;
    
    return expenses.filter(expense => {
      let matchesCategory = true;
      let matchesStatus = true;

      // 1. 類別篩選
      if (filterCategory !== 'All' && filterCategory !== '') {
        matchesCategory = expense.category === filterCategory;
      }

      // 2. 狀態篩選
      if (filterStatus !== 'All') {
        matchesStatus = expense.status === filterStatus;
      }
      
      return matchesCategory && matchesStatus;
    });
  }, [expenses, filters]);

  // 計算總額 (基於篩選後的結果)
  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2);
  }, [filteredExpenses]);
  
  const totalPending = useMemo(() => {
    return filteredExpenses.filter(e => e.status === 'Pending').length;
  }, [filteredExpenses]);

  const totalApproved = useMemo(() => {
    return filteredExpenses.filter(e => e.status === 'Approved').length;
  }, [filteredExpenses]);


  // === 渲染處理 ===

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-indigo-600">載入中... 請稍候。</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-100 p-4">
        <div className="text-xl font-semibold text-red-700">發生錯誤: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* 標題與用戶狀態 */}
        <header className="mb-8 border-b pb-4">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">費用申報與追蹤系統</h1>
          <p className="text-sm text-gray-500">
            使用者 ID: <span className="font-mono text-indigo-600 break-all">{userId || '未登入'}</span> 
            (資料將儲存在此 ID 下的私有路徑)
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 左側：費用申報表單 */}
          <div className="lg:col-span-1" id="expense-form-card">
            <div className="bg-white p-6 rounded-xl shadow-2xl sticky top-8">
              <h2 className="text-2xl font-bold mb-6 text-indigo-700">
                {isEditing ? '編輯費用記錄' : '新增費用記錄'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* 費用日期 */}
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">日期 <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                {/* 費用類別 */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">類別 <span className="text-red-500">*</span></label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border focus:border-indigo-500 focus:ring-indigo-500 bg-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value} disabled={cat.value === ''}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 費用金額 */}
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700">金額 (TWD) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="例如: 1500.00"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                {/* 費用說明 */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">說明 (選填)</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    placeholder="請簡述費用用途"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                
                {/* 狀態 (僅在編輯時顯示) */}
                {isEditing && (
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">狀態</label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border focus:border-indigo-500 focus:ring-indigo-500 bg-white"
                        >
                            {Object.keys(STATUS_MAP).map(key => (
                                <option key={key} value={key}>{STATUS_MAP[key]}</option>
                            ))}
                        </select>
                    </div>
                )}


                {/* 按鈕組 */}
                <div className="flex space-x-3 pt-2">
                  <button
                    type="submit"
                    className={`flex-grow inline-flex justify-center py-3 px-4 border border-transparent shadow-md text-sm font-medium rounded-lg text-white ${isEditing ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150`}
                  >
                    {isEditing ? '儲存修改' : '提交申報'}
                  </button>
                  {isEditing && (
                    <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="w-1/3 inline-flex justify-center py-3 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
                    >
                        取消
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* 右側：追蹤儀表板與列表 */}
          <div className="lg:col-span-2">
            
            {/* 篩選面板 */}
            <div className="bg-white p-4 rounded-xl shadow-md mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">篩選器</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 類別篩選 */}
                    <div>
                        <label htmlFor="filter-category" className="block text-sm font-medium text-gray-700">依類別篩選</label>
                        <select
                            id="filter-category"
                            name="category"
                            value={filters.category}
                            onChange={handleFilterChange}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 border focus:border-indigo-500 focus:ring-indigo-500 bg-white"
                        >
                            <option value="All">全部類別</option>
                            {CATEGORIES.filter(c => c.value !== '').map(cat => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 狀態篩選 */}
                    <div>
                        <label htmlFor="filter-status" className="block text-sm font-medium text-gray-700">依狀態篩選</label>
                        <select
                            id="filter-status"
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 border focus:border-indigo-500 focus:ring-indigo-500 bg-white"
                        >
                            {STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* 總額儀表板 (反映篩選結果) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-500">
                <p className="text-sm font-medium text-gray-500">篩選結果總額</p>
                <p className="mt-1 text-3xl font-extrabold text-gray-900">TWD {totalAmount}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
                <p className="text-sm font-medium text-gray-500">待審核筆數</p>
                <p className="mt-1 text-3xl font-extrabold text-gray-900">{totalPending}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                <p className="text-sm font-medium text-gray-500">已批准筆數</p>
                <p className="mt-1 text-3xl font-extrabold text-gray-900">{totalApproved}</p>
              </div>
            </div>

            {/* 費用清單 */}
            <h2 className="text-2xl font-bold mb-4 text-gray-900">費用記錄清單 ({filteredExpenses.length} 筆)</h2>
            <div className="bg-white rounded-xl shadow-2xl overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">狀態</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">日期</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">類別</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">金額 (TWD)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-3/12">說明</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                        目前沒有符合篩選條件的費用記錄。
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-indigo-50 transition duration-100">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={expense.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {CATEGORIES.find(c => c.value === expense.category)?.label || expense.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right text-indigo-600">
                          {expense.amount.toFixed(2).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">{expense.description || '無'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEdit(expense)}
                            className="text-indigo-600 hover:text-indigo-900 transition duration-150 p-1 rounded hover:bg-indigo-100"
                            title="編輯"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-4.606 6.472L5 13.914V16h2.086l6.215-6.215-2.828-2.828-4.606 4.606z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="text-red-600 hover:text-red-900 transition duration-150 p-1 rounded hover:bg-red-100"
                            title="刪除"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 10-2 0v6a1 1 0 102 0V8z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
