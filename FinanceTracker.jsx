import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Clock, Folder, CheckCircle, Plus, Upload, XCircle, ChevronDown, Filter, Database, Calendar, Edit, X } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'; 

// --- 輔助函數和數據定義 ---

// 模擬交易數據 (僅在 Firebase 讀取失敗時作為備用)
const mockTransactions = [
    { id: 'mock1', date: '2025-09-01', description: '上月薪資入帳', type: 'Income', category: '薪資 (Salary)', amount: 80000, status: 'Completed', timestamp: new Date('2025-09-01T10:00:00Z') },
    { id: 'mock2', date: '2025-09-15', description: '9月房租', type: 'Expense', category: '房租/房貸 (Rent/Mortgage)', amount: 15000, status: 'Completed', timestamp: new Date('2025-09-15T10:00:00Z') },
    { id: 'mock3', date: '2025-10-01', description: '月薪入帳', type: 'Income', category: '薪資 (Salary)', amount: 85000, status: 'Completed', timestamp: new Date('2025-10-01T10:00:00Z') },
    { id: 'mock4', date: '2025-10-02', description: '10月房租', type: 'Expense', category: '房租/房貸 (Rent/Mortgage)', amount: 15000, status: 'Completed', timestamp: new Date('2025-10-02T10:00:00Z') },
    { id: 'mock5', date: '2025-10-03', description: '超市購物', type: 'Expense', category: '食材採購 (Groceries)', amount: 1200, status: 'Completed', timestamp: new Date('2025-10-03T10:00:00Z') },
    { id: 'mock6', date: '2025-10-05', description: '兼職收入', type: 'Income', category: '副業收入 (Side Income)', amount: 5000, status: 'Completed', timestamp: new Date('2025-10-05T10:00:00Z') },
    { id: 'mock7', date: '2025-10-08', description: '交通費', type: 'Expense', category: '交通費用 (Transportation)', amount: 500, status: 'Completed', timestamp: new Date('2025-10-08T10:00:00Z') },
];

/**
 * 計算總結數據 (收入、支出、結餘)
 * @param {Array} transactions - 交易清單
 */
const calculateSummary = (transactions) => {
    let income = 0;
    let expense = 0;
    transactions.forEach(t => {
        if (t.type === 'Income' && t.status === 'Completed') {
            income += t.amount;
        } else if (t.type === 'Expense' && t.status === 'Completed') {
            expense += t.amount;
        }
    });
    return { income, expense, balance: income - expense };
};

/**
 * 格式化金額為貨幣顯示 (使用新台幣 NT$)
 * @param {number} amount - 金額
 */
const formatCurrency = (amount) => {
    return `NT$ ${amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
};

// --- 組件定義 ---

/**
 * 統計數據卡片組件
 */
const StatCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className={`p-5 rounded-xl shadow-lg border-l-4 ${colorClass.border} bg-white transition hover:shadow-xl`}>
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <Icon className={`w-5 h-5 ${colorClass.text}`} />
        </div>
        <p className="text-2xl font-bold mt-1 text-gray-900">{formatCurrency(value)}</p>
    </div>
);

/**
 * 交易記錄表格的單行組件
 */
const TransactionRow = ({ transaction }) => {
    const isExpense = transaction.type === 'Expense';
    const amountClass = isExpense ? 'text-rose-600' : 'text-emerald-600';
    const sign = isExpense ? '-' : '+';

    return (
        <tr className="hover:bg-gray-50 transition duration-150">
            <td className="p-3 text-sm text-gray-700 font-medium">
                {transaction.description}
            </td>
            <td className="p-3 text-sm text-gray-500">
                {transaction.date}
            </td>
            <td className="p-3 text-sm text-gray-500 whitespace-nowrap">
                {transaction.category}
            </td>
            <td className={`p-3 text-sm font-semibold text-right ${amountClass}`}>
                {sign} {formatCurrency(transaction.amount)}
            </td>
            <td className="p-3 text-sm text-gray-500 text-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    transaction.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                    {transaction.status === 'Completed' ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                    {transaction.status === 'Completed' ? '已完成' : '待處理'}
                </span>
            </td>
            <td className="p-3 text-right">
                <button className="text-gray-400 hover:text-igb-blue p-1 rounded-full transition-colors" title="編輯交易">
                    <Edit className="w-4 h-4" />
                </button>
                <button className="text-gray-400 hover:text-rose-600 p-1 rounded-full transition-colors" title="刪除交易">
                    <X className="w-4 h-4" />
                </button>
            </td>
        </tr>
    );
};


/**
 * 交易記錄表格組件 (修正 ReferenceError)
 */
const TransactionTable = ({ transactions }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Folder className="w-5 h-5 mr-2 text-igb-blue" />
                交易記錄 (總覽)
            </h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                摘要
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                日期
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                會計科目
                            </th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                金額 (NT$)
                            </th>
                            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                狀態
                            </th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                操作
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.length > 0 ? (
                            transactions.map(t => (
                                <TransactionRow key={t.id} transaction={t} />
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="py-8 text-center text-gray-500">
                                    <XCircle className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                                    目前沒有任何交易記錄。請新增一筆交易。
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


/**
 * 新增交易表單組件
 */
const NewTransactionForm = ({ db, userId, onTransactionAdded }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().substring(0, 10),
        type: 'Expense',
        category: '',
        amount: 0,
        description: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    // 詳細會計科目
    const categories = {
        Income: [
            '薪資 (Salary)', 
            '獎金 (Bonus)', 
            '投資收益 (Investment Income)', 
            '副業收入 (Side Income)', 
            '利息/股息 (Interest/Dividend)', 
            '禮金/贈與 (Gifts)'
        ],
        Expense: [
            '餐飲外食 (Dining Out)', 
            '食材採購 (Groceries)', 
            '房租/房貸 (Rent/Mortgage)', 
            '水電瓦斯 (Utilities)', 
            '交通費用 (Transportation)', 
            '汽車開支 (Car Expenses)', 
            '娛樂休閒 (Entertainment)', 
            '購物消費 (Shopping)', 
            '醫療保健 (Health)', 
            '教育進修 (Education)', 
            '保險支出 (Insurance)', 
            '其他支出 (Other)'
        ],
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!db || !userId) {
            setMessage('錯誤：Firebase 或用戶未初始化。無法儲存。');
            return;
        }

        setIsLoading(true);
        setMessage('');

        try {
            // 構建交易對象
            const transactionData = {
                ...formData,
                amount: parseFloat(formData.amount), // 確保金額為數字
                userId: userId,
                status: 'Completed', 
                timestamp: serverTimestamp(), // 記錄伺服器時間戳
            };

            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const transactionsRef = collection(db, `artifacts/${appId}/users/${userId}/transactions`);
            
            await addDoc(transactionsRef, transactionData);

            setMessage('交易儲存成功！');
            // 提交後重置部分欄位
            setFormData(prev => ({
                ...prev,
                category: '',
                amount: 0,
                description: '',
            }));
            onTransactionAdded(); 

        } catch (error) {
            console.error("Error submitting transaction: ", error);
            setMessage(`交易儲存失敗: ${error.message}`);
        } finally {
            setIsLoading(false);
            setTimeout(() => setMessage(''), 5000);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-indigo-600" />
                新增交易 (會計分錄)
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 日期 */}
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700">日期</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                            className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                            disabled={isLoading}
                        />
                    </div>
                    {/* 類型 */}
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">類型</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm bg-white"
                            disabled={isLoading}
                        >
                            <option value="Expense">支出</option>
                            <option value="Income">收入</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 金額 */}
                    <div className="md:col-span-2">
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">金額 (NT$)</label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            required
                            min="0.01"
                            step="0.01"
                            className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                            disabled={isLoading}
                        />
                    </div>
                    {/* 類別 */}
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">會計科目</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                            className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm bg-white"
                            disabled={isLoading}
                        >
                            <option value="">選擇科目</option>
                            {/* 根據類型動態顯示類別 */}
                            {categories[formData.type].map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 描述/備註 */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">備註/摘要</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="2"
                        className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm resize-none"
                        placeholder="請註明這筆交易或申報單據"
                        disabled={isLoading}
                    ></textarea>
                </div>

                {/* 上傳憑證 (Placeholder) 和確認按鈕 */}
                <div className="flex items-center justify-between pt-2">
                    <button
                        type="button"
                        className="flex items-center px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition duration-150 shadow-sm disabled:opacity-50"
                        onClick={() => console.log('Upload receipt clicked')}
                        disabled={isLoading}
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        上傳憑證/收據
                    </button>
                    <button
                        type="submit"
                        className="flex items-center px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 transform active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <Plus className="w-5 h-5 mr-1" />
                        )}
                        儲存交易
                    </button>
                </div>
                {message && (
                    <div className={`mt-3 p-3 text-sm rounded-lg ${message.startsWith('錯誤') ? 'bg-rose-100 text-rose-700' : 'bg-green-100 text-green-700'}`}>
                        {message}
                    </div>
                )}
            </form>
        </div>
    );
};

/**
 * 數據處理函數：將交易數據聚合成每月/每日的收支總額
 * @param {Array} transactions - 交易清單
 * @param {string} granularity - 'monthly' 或 'daily'
 * @returns {Array} 聚合後的數據
 */
const aggregateData = (transactions, granularity = 'monthly') => {
    // 1. 過濾並格式化數據
    const completedTransactions = transactions.filter(t => t.status === 'Completed');

    // 2. 聚合邏輯
    const aggregates = {};

    completedTransactions.forEach(t => {
        let key;
        // 確保 date 字段存在且格式正確
        if (!t.date || typeof t.date !== 'string') return;
        
        const [year, month, day] = t.date.split('-');
        
        if (granularity === 'daily') {
            key = `${year}-${month}-${day}`;
        } else { // 預設為 monthly
            key = `${year}-${month}`;
        }

        if (!aggregates[key]) {
            aggregates[key] = { name: key, Income: 0, Expense: 0 };
        }

        if (t.type === 'Income') {
            aggregates[key].Income += t.amount;
        } else if (t.type === 'Expense') {
            aggregates[key].Expense += t.amount;
        }
    });

    // 3. 轉換為陣列並排序
    const sortedData = Object.values(aggregates).sort((a, b) => {
        return a.name.localeCompare(b.name);
    });

    return sortedData;
};


/**
 * 交易趨勢圖表組件
 */
const TransactionChart = ({ transactions }) => {
    const [granularity, setGranularity] = useState('monthly'); // 'monthly' 或 'daily'
    
    // 使用 useMemo 優化聚合計算
    const aggregatedData = useMemo(() => {
        return aggregateData(transactions, granularity);
    }, [transactions, granularity]);


    const handleGranularityChange = (newGranularity) => {
        setGranularity(newGranularity);
    };
    
    // 自定義工具提示內容
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md text-sm">
                    <p className="font-bold text-gray-700 mb-1">{granularity === 'monthly' ? `月份: ${label}` : `日期: ${label}`}</p>
                    {payload.map((item, index) => (
                        <p key={index} style={{ color: item.color }}>
                            {item.name}: <strong>{formatCurrency(item.value)}</strong>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };


    return (
        <div className="bg-white p-6 rounded-xl shadow-lg h-96">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
                    收支趨勢圖 ({granularity === 'monthly' ? '月度' : '日度'})
                </h2>
                <div className='flex space-x-2'>
                    <button
                        className={`text-sm py-1 px-3 rounded-full transition ${granularity === 'monthly' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        onClick={() => handleGranularityChange('monthly')}
                    >
                        月度
                    </button>
                    <button
                        className={`text-sm py-1 px-3 rounded-full transition ${granularity === 'daily' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        onClick={() => handleGranularityChange('daily')}
                    >
                        日度
                    </button>
                </div>
            </div>
            
            {aggregatedData.length < 2 ? (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-center text-gray-500">
                        <Calendar className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-lg font-medium">尚無足夠數據繪製圖表</p>
                        <p className="text-sm">請至少新增兩筆不同日期/月份的交易。</p>
                    </div>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="85%">
                    <LineChart
                        data={aggregatedData}
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis dataKey="name" stroke="#666" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#666" tick={{ fontSize: 12 }} tickFormatter={(value) => (value / 1000).toFixed(0) + 'K'} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                        {/* 收入線 - 綠色 */}
                        <Line 
                            type="monotone" 
                            dataKey="Income" 
                            stroke="#10B981" 
                            strokeWidth={3} 
                            activeDot={{ r: 5 }} 
                            name="收入 (Income)"
                        />
                        {/* 支出線 - 紅色 */}
                        <Line 
                            type="monotone" 
                            dataKey="Expense" 
                            stroke="#F43F5E" 
                            strokeWidth={3} 
                            activeDot={{ r: 5 }} 
                            name="支出 (Expense)"
                        />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};


// --- 主應用程式組件 ---
const App = () => {
    // Firebase 狀態
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [firebaseStatus, setFirebaseStatus] = useState('初始化中...');
    
    // 交易數據狀態
    const [transactions, setTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(true);
    
    // 計算統計摘要 (在 transactions 變化時自動更新)
    const summary = calculateSummary(transactions);

    // Tailwind 顏色配置
    const incomeColor = { text: 'text-emerald-600', border: 'border-emerald-500' };
    const expenseColor = { text: 'text-rose-600', border: 'border-rose-500' };
    const balanceColor = { text: 'text-indigo-600', border: 'border-indigo-500' };
    
    // App ID
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    // 1. Firebase 初始化與身份驗證
    useEffect(() => {
        try {
            const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
            const app = initializeApp(firebaseConfig);
            const firestoreDb = getFirestore(app);
            const firebaseAuth = getAuth(app);

            setDb(firestoreDb);
            setAuth(firebaseAuth);

            setFirebaseStatus('等待登入...');

            // 監聽身份驗證狀態變化
            const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
                if (user) {
                    setUserId(user.uid);
                    setFirebaseStatus(`已連線 | 用戶 ID: ${user.uid.substring(0, 8)}...`);
                } else {
                    // 嘗試使用自定義 Token 或匿名登入
                    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                    try {
                        if (initialAuthToken) {
                            await signInWithCustomToken(firebaseAuth, initialAuthToken);
                        } else {
                            await signInAnonymously(firebaseAuth);
                        }
                    } catch (error) {
                        console.error("Firebase 身份驗證錯誤:", error);
                        setFirebaseStatus(`初始化失敗: ${error.code}`);
                    }
                }
            });

            return () => unsubscribe(); 

        } catch (error) {
            console.error("Firebase 初始化失敗: ", error);
            setFirebaseStatus(`初始化失敗: ${error.message}`);
            // 使用 mock 數據作為備用
            setTransactions(mockTransactions); 
            setLoadingTransactions(false);
        }
    }, []);

    // 2. 實時獲取交易數據 (onSnapshot)
    useEffect(() => {
        if (!db || !userId) return;

        setLoadingTransactions(true);
        const transactionsRef = collection(db, `artifacts/${appId}/users/${userId}/transactions`);
        
        // 設置查詢：按時間戳降序排列
        const q = query(transactionsRef, orderBy("timestamp", "desc"));

        // 監聽實時數據
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedTransactions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // 將 Firebase Timestamp 轉換為 JavaScript Date 對象
                timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : new Date(),
            }));
            setTransactions(fetchedTransactions);
            setLoadingTransactions(false);

        }, (error) => {
            console.error("Error listening to transactions: ", error);
            setFirebaseStatus(`數據同步失敗: ${error.message}`);
            setLoadingTransactions(false);
        });

        return () => unsubscribe();
    }, [db, userId, appId]);

    const handleTransactionAdded = () => {
        // onSnapshot 會處理更新，此函數僅用於向下傳遞
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
            <style jsx global>{`
                .text-igb-blue { color: #4F46E5; }
                .bg-igb-blue { background-color: #4F46E5; }
                .hover\:bg-igb-blue:hover { background-color: #4338CA; }
                .border-igb-blue { border-color: #4F46E5; }
                .focus\:ring-igb-blue:focus { --tw-ring-color: #4F46E5; }
            `}</style>
            <div className="max-w-7xl mx-auto">
                {/* 標頭 */}
                <header className="flex justify-between items-center mb-8 border-b pb-2">
                    <h1 className="text-3xl font-extrabold text-gray-900">
                        IGB WEB 2.0 個人財務儀表板
                    </h1>
                    {/* Firebase 狀態顯示 */}
                    <div className="flex items-center text-sm font-medium p-2 rounded-lg bg-white shadow-sm border">
                        <Database className={`w-4 h-4 mr-2 ${
                            firebaseStatus.includes('初始化中') || firebaseStatus.includes('等待') ? 'text-yellow-500 animate-pulse' :
                            firebaseStatus.includes('連線') ? 'text-green-600' :
                            'text-red-500'
                        }`} />
                        <span className={`text-gray-700`}>{firebaseStatus}</span>
                    </div>
                </header>

                {/* 統計卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard 
                        title="總收入 (已完成)" 
                        value={summary.income} 
                        icon={TrendingUp} 
                        colorClass={incomeColor} 
                    />
                    <StatCard 
                        title="總支出 (已完成)" 
                        value={summary.expense} 
                        icon={TrendingDown} 
                        colorClass={expenseColor} 
                    />
                    <StatCard 
                        title="淨結餘" 
                        value={summary.balance} 
                        icon={DollarSign} 
                        colorClass={balanceColor} 
                    />
                </div>

                {/* 主要內容：表單與圖表 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* 新增交易表單 (佔 1/3 寬度) */}
                    <div className="lg:col-span-1">
                        <NewTransactionForm 
                            db={db} 
                            userId={userId} 
                            onTransactionAdded={handleTransactionAdded}
                        />
                    </div>
                    {/* 圖表 (佔 2/3 寬度) */}
                    <div className="lg:col-span-2">
                        <TransactionChart transactions={transactions} />
                    </div>
                </div>

                {/* 交易紀錄表格 (已修正 ReferenceError) */}
                <div className="mt-8">
                    {loadingTransactions ? (
                        <div className="text-center p-8 bg-white rounded-xl shadow-lg text-gray-500">
                            <svg className="animate-spin h-5 w-5 text-indigo-600 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            正在從雲端載入交易記錄...
                        </div>
                    ) : (
                        <TransactionTable transactions={transactions} />
                    )}
                </div>
                
                {/* 底部顯示完整 User ID */}
                <footer className="mt-8 text-center text-sm text-gray-500">
                    {userId && <p>當前用戶 ID (用於共享/識別): <span className="font-mono text-gray-700 break-all">{userId}</span></p>}
                </footer>
            </div>
        </div>
    );
};

export default App;
