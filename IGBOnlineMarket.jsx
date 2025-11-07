import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    DollarSign, TrendingUp, TrendingDown, Clock, Folder, CheckCircle, Plus, Upload, XCircle, ChevronDown, Filter, Database, Calendar, Edit, X, ArrowUp, ArrowDown, PieChart, ShoppingCart, Home, Menu, Search, Package, Zap 
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Pie, Cell } from 'recharts'; 

// --- 輔助函數和數據定義 (與 FinanceTracker.jsx 相同) ---

// 交易數據結構定義 (已隱藏 mock 數據以保持簡潔，但結構與原文件相同)
// ... (mockTransactions, calculateSummary, formatCurrency, getAllExpenseCategories 函數保持不變)

/**
 * 格式化金額為貨幣顯示 (使用新台幣 NT$)
 * @param {number} amount - 金額
 */
const formatCurrency = (amount) => {
    const num = Number(amount);
    return `NT$ ${num.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
};

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

// 收入類別
const IncomeCategories = [
    '薪資 (Salary)', '獎金 (Bonus)', '投資收益 (Investment Income)', '副業收入 (Side Income)', '利息/股息 (Interest/Dividend)', '禮金/贈與 (Gifts)'
];

// 支出類別
const ExpenseCategories = [
    { group: '💼 旅費及交通費 (Travel & Transport)', items: ['國內差旅費', '國外差旅費', '市區交通費', '高鐵/火車票', '機票費用', '住宿費用'] },
    { group: '🍽️ 餐費及招待費 (Meals & Entertainment)', items: ['客戶招待費', '員工福利餐費', '內部會議餐飲'] },
    { group: '📦 辦公與行政費 (Office & Admin)', items: ['辦公用品及耗材', '郵電/通訊費', '租金支出', '水電瓦斯費', '修繕與維護費', '報章雜誌訂閱費'] },
    { group: '💻 資訊與軟體費 (IT & Software)', items: ['軟體訂閱費', '硬體採購費', '資訊服務費', '雲端服務費', '網站網域名稱費'] },
    { group: '📈 行銷與業務費 (Marketing & Sales)', items: ['廣告與宣傳費', '業務交際費', '展覽費', '印刷宣傳品', '市場調研費'] },
    { group: '📚 培訓與人才費 (Training & HR)', items: ['專業培訓費', '招募費用', '教育訓練課程費', '員工健康檢查費'] },
    { group: '🧑‍💻 專業服務費 (Professional Services)', items: ['顧問費', '法律及會計費用', '外部審計費', '翻譯/口譯費'] },
    { group: '🏦 財務與雜項費 (Financial & Misc.)', items: ['銀行手續費', '利息支出', '政府規費與罰鍰', '保險費', '慈善捐贈'] },
    { group: '❓ 其他雜項費用 (Miscellaneous)', items: ['網路菜市場購物'] }, // 新增一個專屬類別
];

/**
 * 從結構化支出清單中提取所有類別名稱
 */
const getAllExpenseCategories = () => {
    return ExpenseCategories.flatMap(group => group.items);
};

// 顏色列表用於圓餅圖
const CHART_COLORS = [
    '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', 
    '#6366F1', '#EC4899', '#84CC16', '#F97316', '#64748B',
    '#059669', '#3B82F6', '#8B5CF6', '#D946EF', '#F43F5E',
];

/**
 * 聚合數據：計算每個類別的總支出
 */
const aggregateDataByCategory = (transactions) => {
    const expenseAggregates = {};
    const completedExpenses = transactions.filter(t => t.type === 'Expense' && t.status === 'Completed');

    completedExpenses.forEach(t => {
        const category = t.category || '未分類';
        expenseAggregates[category] = (expenseAggregates[category] || 0) + t.amount;
    });

    const totalExpense = completedExpenses.reduce((sum, t) => sum + t.amount, 0);
    const chartData = Object.entries(expenseAggregates).map(([name, value]) => ({
        name,
        value,
        percent: totalExpense > 0 ? (value / totalExpense) * 100 : 0,
    }));
    return chartData.sort((a, b) => b.value - a.value);
};

/**
 * 數據處理函數：將交易數據聚合成每月/每日的收支總額
 */
const aggregateData = (transactions, granularity = 'monthly') => {
    const completedTransactions = transactions.filter(t => t.status === 'Completed');
    const aggregates = {};

    completedTransactions.forEach(t => {
        let key;
        if (!t.date || typeof t.date !== 'string') return;
        
        const [year, month, day] = t.date.split('-');
        
        if (granularity === 'daily') {
            key = `${year}-${month}-${day}`;
        } else {
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

    return Object.values(aggregates).sort((a, b) => a.name.localeCompare(b.name));
};


// --- Market View 專用數據與組件 ---

const mockProducts = [
    { id: 1, name: '台灣高山高麗菜', price: 65, unit: '顆', icon: '🥬' },
    { id: 2, name: '履歷紅心芭樂', price: 90, unit: '斤', icon: ' Guava' },
    { id: 3, name: '現撈東港黑鮪魚', price: 800, unit: '兩', icon: '🍣' },
    { id: 4, name: '新鮮放山雞蛋', price: 120, unit: '盒 (10顆)', icon: '🥚' },
    { id: 5, name: '有機地瓜葉', price: 45, unit: '把', icon: '🍠' },
    { id: 6, name: '台農17號金鑽鳳梨', price: 75, unit: '顆', icon: '🍍' },
];

/**
 * 單一產品卡片
 */
const ProductCard = ({ product, addToCart }) => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition duration-300 transform hover:-translate-y-1">
        <div className="p-4 sm:p-6 flex flex-col h-full">
            <div className="flex justify-between items-start mb-3">
                <span className="text-3xl" role="img" aria-label={product.name}>{product.icon}</span>
                <span className="text-xs font-semibold uppercase text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">在地嚴選</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{product.name}</h3>
            <p className="text-sm text-gray-500 mb-4 flex-grow">
                {formatCurrency(product.price)} / {product.unit}
            </p>
            <button
                onClick={() => addToCart(product)}
                className="mt-auto w-full flex items-center justify-center px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-150 transform active:scale-95 shadow-md"
            >
                <ShoppingCart className="w-4 h-4 mr-2" />
                加入購物車
            </button>
        </div>
    </div>
);

/**
 * 購物車側邊欄
 */
const CartSidebar = ({ cart, setCart, db, userId, onTransactionAdded }) => {
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const updateQuantity = (id, change) => {
        setCart(prev => {
            const item = prev.find(i => i.id === id);
            if (!item) return prev;
            
            const newQuantity = item.quantity + change;
            if (newQuantity <= 0) {
                return prev.filter(i => i.id !== id);
            }
            return prev.map(i => i.id === id ? { ...i, quantity: newQuantity } : i);
        });
    };

    const handleCheckout = async () => {
        if (total === 0 || !db || !userId) {
            setMessage('購物車為空或連線錯誤，無法結帳。');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        setIsLoading(true);
        setMessage('');

        try {
            // 1. 構建交易對象 (作為單筆支出記錄)
            const transactionData = {
                date: new Date().toISOString().substring(0, 10),
                type: 'Expense',
                category: '網路菜市場購物', // 使用專屬類別
                amount: total,
                description: `網路菜市場結帳 ${cart.length} 件商品`,
                userId: userId,
                status: 'Completed', 
                timestamp: serverTimestamp(),
                cartDetails: JSON.stringify(cart.map(item => ({ name: item.name, qty: item.quantity, price: item.price }))),
            };

            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const transactionsRef = collection(db, `artifacts/${appId}/users/${userId}/transactions`);
            
            await addDoc(transactionsRef, transactionData);

            setMessage('結帳成功！支出已記錄到財務儀表板。');
            setCart([]); // 清空購物車
            onTransactionAdded(); 

        } catch (error) {
            console.error("Error during checkout: ", error);
            setMessage(`結帳失敗: ${error.message}`);
        } finally {
            setIsLoading(false);
            setTimeout(() => setMessage(''), 5000);
        }
    };


    return (
        <div className="bg-white p-6 rounded-xl shadow-2xl border-2 border-indigo-100 flex flex-col h-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <ShoppingCart className="w-6 h-6 mr-2 text-indigo-600" />
                我的購物車
            </h2>
            <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                {cart.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <Package className="w-8 h-8 mx-auto mb-2" />
                        <p>購物車是空的，快去採購吧！</p>
                    </div>
                ) : (
                    cart.map(item => (
                        <div key={item.id} className="flex justify-between items-center border-b pb-2 last:border-b-0">
                            <div className='flex-1 pr-2'>
                                <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                                <p className="text-xs text-gray-500">{formatCurrency(item.price)} x {item.quantity}</p>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-gray-500 hover:text-red-500 rounded-full transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                                <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-gray-500 hover:text-green-500 rounded-full transition-colors">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-6 pt-4 border-t-2 border-indigo-50">
                <div className="flex justify-between items-center text-lg font-bold mb-3 text-gray-900">
                    <span>總計：</span>
                    <span>{formatCurrency(total)}</span>
                </div>
                <button
                    onClick={handleCheckout}
                    disabled={total === 0 || isLoading}
                    className="w-full py-3 px-4 flex items-center justify-center font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition duration-150 transform active:scale-95 disabled:bg-gray-400 shadow-xl"
                >
                    {isLoading ? (
                        <svg className="animate-spin h-5 w-5 text-white mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                        <Zap className="w-5 h-5 mr-2" />
                    )}
                    確認結帳
                </button>
                {message && (
                    <div className={`mt-3 p-3 text-sm rounded-lg ${message.startsWith('結帳失敗') ? 'bg-rose-100 text-rose-700' : 'bg-green-100 text-green-700'}`}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * 網路菜市場主要視圖
 */
const MarketView = ({ db, userId, onTransactionAdded }) => {
    const [cart, setCart] = useState([]);

    const addToCart = (product) => {
        setCart(prev => {
            const existingItem = prev.find(item => item.id === product.id);
            if (existingItem) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                return [...prev, { ...product, quantity: 1 }];
            }
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[80vh]">
            {/* 產品列表 (3/4 寬度) */}
            <div className="lg:col-span-3">
                <div className="flex justify-between items-center mb-6 border-b pb-3">
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center">
                        <Menu className="w-6 h-6 mr-3 text-emerald-600" />
                        當日生鮮精選
                    </h2>
                    <div className="relative">
                        <input type="text" placeholder="搜尋商品..." className="p-2 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                    {mockProducts.map(product => (
                        <ProductCard key={product.id} product={product} addToCart={addToCart} />
                    ))}
                </div>
            </div>

            {/* 購物車 (1/4 寬度) */}
            <div className="lg:col-span-1">
                <CartSidebar 
                    cart={cart} 
                    setCart={setCart} 
                    db={db} 
                    userId={userId} 
                    onTransactionAdded={onTransactionAdded} 
                />
            </div>
        </div>
    );
};

// --- Finance Dashboard Components (由 FinanceTracker.jsx 調整為子組件) ---

// 交易記錄表格的單行組件 (TransactionRow)
const TransactionRow = ({ transaction, db, userId, onTransactionDeleted }) => {
    const isExpense = transaction.type === 'Expense';
    const amountClass = isExpense ? 'text-rose-600' : 'text-emerald-600';
    const sign = isExpense ? '-' : '+';
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    const handleDelete = async (transactionId) => {
        if (!db || !userId) {
            console.error("Firebase 或用戶未初始化，無法刪除。");
            return;
        }
        
        if (window.confirm(`確定要刪除這筆交易嗎？\n[${transaction.category}] ${transaction.description}: ${formatCurrency(transaction.amount)}`)) {
            try {
                const transactionRef = doc(db, `artifacts/${appId}/users/${userId}/transactions`, transactionId);
                await deleteDoc(transactionRef);
                onTransactionDeleted();
                console.log("Transaction successfully deleted!");
            } catch (error) {
                console.error("Error deleting transaction: ", error);
                alert(`刪除交易失敗: ${error.message}`);
            }
        }
    };

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
                    {transaction.status === 'Completed' ? '已完成' : '待處理'}
                </span>
            </td>
            <td className="p-3 text-right">
                <button className="text-gray-400 hover:text-igb-blue p-1 rounded-full transition-colors" title="編輯交易 (尚未實作)">
                    <Edit className="w-4 h-4" />
                </button>
                <button 
                    className="text-gray-400 hover:text-rose-600 p-1 rounded-full transition-colors" 
                    title="刪除交易"
                    onClick={() => handleDelete(transaction.id)}
                >
                    <X className="w-4 h-4" />
                </button>
            </td>
        </tr>
    );
};

// 交易記錄表格組件 (TransactionTable)
const TransactionTable = ({ transactions, filter, setFilter, sort, setSort, db, userId, onTransactionDeleted }) => {
    // ... (邏輯與原文件相同)
    const handleSortChange = (field) => {
        setSort(prev => ({
            field: field,
            direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
        }));
    };

    const allCategories = useMemo(() => {
        const income = IncomeCategories;
        const expense = getAllExpenseCategories();
        return [...new Set([...income, ...expense])].sort();
    }, []);

    const SortIcon = ({ field }) => {
        if (sort.field !== field) return <ChevronDown className="w-3 h-3 ml-1 text-gray-400" />;
        return sort.direction === 'asc' 
            ? <ArrowUp className="w-3 h-3 ml-1 text-gray-700" />
            : <ArrowDown className="w-3 h-3 ml-1 text-gray-700" />;
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Folder className="w-5 h-5 mr-2 text-igb-blue" />
                交易記錄 (總覽)
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
                <div className='flex-1'>
                    <label htmlFor="filterType" className="block text-xs font-medium text-gray-500 mb-1">依類型篩選</label>
                    <select
                        id="filterType"
                        value={filter.type}
                        onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                        <option value="">所有類型</option>
                        <option value="Income">收入</option>
                        <option value="Expense">支出</option>
                    </select>
                </div>
                <div className='flex-1'>
                    <label htmlFor="filterCategory" className="block text-xs font-medium text-gray-500 mb-1">依科目篩選</label>
                    <select
                        id="filterCategory"
                        value={filter.category}
                        onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                        <option value="">所有科目</option>
                        {allCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <div className='flex-1 flex items-end'>
                    <button
                        onClick={() => setFilter({ type: '', category: '' })}
                        className="w-full py-2 px-4 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-100 transition-colors"
                    >
                        <Filter className="w-4 h-4 mr-1 inline-block" />
                        重設篩選
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">摘要</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSortChange('date')}><div className='flex items-center'>日期 <SortIcon field="date" /></div></th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSortChange('category')}><div className='flex items-center'>會計科目 <SortIcon field="category" /></div></th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSortChange('amount')}><div className='flex items-center justify-end'>金額 (NT$) <SortIcon field="amount" /></div></th>
                            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.length > 0 ? (
                            transactions.map(t => (
                                <TransactionRow 
                                    key={t.id} 
                                    transaction={t} 
                                    db={db} 
                                    userId={userId}
                                    onTransactionDeleted={onTransactionDeleted}
                                />
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="py-8 text-center text-gray-500">
                                    <XCircle className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                                    {filter.type || filter.category ? '在當前篩選條件下找不到交易記錄。' : '目前沒有任何交易記錄。請新增一筆交易。'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// 新增交易表單組件 (NewTransactionForm)
const NewTransactionForm = ({ db, userId, onTransactionAdded }) => {
    // ... (邏輯與原文件相同，略有精簡)
    const [formData, setFormData] = useState({
        date: new Date().toISOString().substring(0, 10),
        type: 'Expense',
        category: '',
        amount: 0,
        description: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const categories = {
        Income: IncomeCategories,
        Expense: ExpenseCategories,
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
            const transactionData = {
                ...formData,
                amount: parseFloat(formData.amount),
                userId: userId,
                status: 'Completed', 
                timestamp: serverTimestamp(),
            };

            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const transactionsRef = collection(db, `artifacts/${appId}/users/${userId}/transactions`);
            
            await addDoc(transactionsRef, transactionData);

            setMessage('交易儲存成功！');
            setFormData(prev => ({ ...prev, category: '', amount: 0, description: '' }));
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
        <div className="bg-white p-6 rounded-xl shadow-lg h-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-indigo-600" />
                新增手動交易
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700">日期</label>
                        <input type="date" name="date" value={formData.date} onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-lg" disabled={isLoading} />
                    </div>
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">類型</label>
                        <select name="type" value={formData.type} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-white" disabled={isLoading}>
                            <option value="Expense">支出</option>
                            <option value="Income">收入</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">金額 (NT$)</label>
                        <input type="number" name="amount" value={formData.amount} onChange={handleChange} required min="0.01" step="0.01" className="mt-1 w-full p-2 border border-gray-300 rounded-lg" disabled={isLoading} />
                    </div>
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">科目</label>
                        <select name="category" value={formData.category} onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-white" disabled={isLoading}>
                            <option value="" disabled>選擇科目</option>
                            {formData.type === 'Income' ? (
                                categories.Income.map(cat => (<option key={cat} value={cat}>{cat}</option>))
                            ) : (
                                categories.Expense.map(group => (
                                    <optgroup key={group.group} label={group.group}>
                                        {group.items.map(item => (<option key={item} value={item}>{item}</option>))}
                                    </optgroup>
                                ))
                            )}
                        </select>
                    </div>
                </div>
                
                <div className='flex-grow'>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">備註/摘要</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows="2" className="mt-1 w-full p-2 border border-gray-300 rounded-lg resize-none" placeholder="請註明這筆交易" disabled={isLoading}></textarea>
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        className="flex items-center px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 transform active:scale-95 disabled:bg-gray-400"
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
                {message && (<div className={`mt-3 p-3 text-sm rounded-lg ${message.startsWith('錯誤') ? 'bg-rose-100 text-rose-700' : 'bg-green-100 text-green-700'}`}>{message}</div>)}
            </form>
        </div>
    );
};

// StatCard 組件
const StatCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className={`p-5 rounded-xl shadow-lg border-l-4 ${colorClass.border} bg-white transition hover:shadow-xl`}>
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <Icon className={`w-5 h-5 ${colorClass.text}`} />
        </div>
        <p className="text-2xl font-bold mt-1 text-gray-900">{formatCurrency(value)}</p>
    </div>
);

// 支出按類別圓餅圖組件 (ExpenseByCategoryChart)
const ExpenseByCategoryChart = ({ transactions }) => {
    const chartData = useMemo(() => aggregateDataByCategory(transactions), [transactions]);
    const totalExpense = chartData.reduce((sum, item) => sum + item.value, 0);

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * Math.PI / 180) * 0.7;
        const y = cy + radius * Math.sin(-midAngle * Math.PI / 180) * 0.7;
        if (percent > 0.05) {
            return (<text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="bold">{`${(percent * 100).toFixed(0)}%`}</text>);
        }
        return null;
    };
    
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md text-sm">
                    <p className="font-bold text-gray-700 mb-1">{data.name}</p>
                    <p style={{ color: payload[0].color }}>金額: <strong>{formatCurrency(data.value)}</strong></p>
                    <p className="text-gray-500">佔比: <strong>{data.percent.toFixed(2)}%</strong></p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg h-96">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><PieChart className="w-5 h-5 mr-2 text-emerald-600" />總支出科目分析 (佔比)</h2>
            {totalExpense === 0 ? (<div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg"><div className="text-center text-gray-500"><DollarSign className="w-8 h-8 mx-auto mb-2" /><p className="text-lg font-medium">尚無支出數據</p></div></div>) : (
                <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#8884d8" labelLine={false} label={renderCustomizedLabel}>
                            {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" formatter={(value) => `${value} (${(chartData.find(d => d.name === value)?.percent || 0).toFixed(1)}%)`}/>
                    </PieChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

// 交易趨勢圖表組件 (TransactionChart)
const TransactionChart = ({ transactions }) => {
    // ... (邏輯與原文件相同)
    const [granularity, setGranularity] = useState('monthly');
    const aggregatedData = useMemo(() => aggregateData(transactions, granularity), [transactions, granularity]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md text-sm">
                    <p className="font-bold text-gray-700 mb-1">{granularity === 'monthly' ? `月份: ${label}` : `日期: ${label}`}</p>
                    {payload.map((item, index) => (<p key={index} style={{ color: item.color }}>{item.name}: <strong>{formatCurrency(item.value)}</strong></p>))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg h-96">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />收支趨勢圖 ({granularity === 'monthly' ? '月度' : '日度'})</h2>
                <div className='flex space-x-2'>
                    <button className={`text-sm py-1 px-3 rounded-full transition ${granularity === 'monthly' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} onClick={() => setGranularity('monthly')}>月度</button>
                    <button className={`text-sm py-1 px-3 rounded-full transition ${granularity === 'daily' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} onClick={() => setGranularity('daily')}>日度</button>
                </div>
            </div>
            
            {aggregatedData.length < 2 ? (<div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg"><div className="text-center text-gray-500"><Calendar className="w-8 h-8 mx-auto mb-2" /><p className="text-lg font-medium">尚無足夠數據繪製趨勢圖</p></div></div>) : (
                <ResponsiveContainer width="100%" height="85%">
                    <LineChart data={aggregatedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis dataKey="name" stroke="#666" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#666" tick={{ fontSize: 12 }} tickFormatter={(value) => (value / 1000).toFixed(0) + 'K'} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                        <Line type="monotone" dataKey="Income" stroke="#10B981" strokeWidth={3} activeDot={{ r: 5 }} name="收入 (Income)"/>
                        <Line type="monotone" dataKey="Expense" stroke="#F43F5E" strokeWidth={3} activeDot={{ r: 5 }} name="支出 (Expense)"/>
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};


/**
 * 財務儀表板視圖 (整合原 FinanceTracker 的所有核心功能)
 */
const FinanceDashboard = ({ db, userId, transactions, loadingTransactions, onTransactionAdded }) => {
    // 篩選與排序狀態
    const [filter, setFilter] = useState({ type: '', category: '' });
    const [sort, setSort] = useState({ field: 'timestamp', direction: 'desc' });
    
    // 根據篩選和排序規則計算顯示的交易列表
    const filteredAndSortedTransactions = useMemo(() => {
        let current = [...transactions];
        if (filter.type) { current = current.filter(t => t.type === filter.type); }
        if (filter.category) { current = current.filter(t => t.category === filter.category); }

        const { field, direction } = sort;
        if (field) {
            current.sort((a, b) => {
                let aVal, bVal;
                if (field === 'date') { aVal = new Date(a.date).getTime(); bVal = new Date(b.date).getTime(); } 
                else if (field === 'amount') { aVal = parseFloat(a.amount); bVal = parseFloat(b.amount); } 
                else { aVal = a[field] || ''; bVal = b[field] || ''; }

                if (aVal < bVal) return direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return current;
    }, [transactions, filter, sort]);

    const summary = calculateSummary(transactions);

    const incomeColor = { text: 'text-emerald-600', border: 'border-emerald-500' };
    const expenseColor = { text: 'text-rose-600', border: 'border-rose-500' };
    const balanceColor = { text: 'text-indigo-600', border: 'border-indigo-500' };

    return (
        <div className="space-y-8">
             {/* 統計卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="總收入" value={summary.income} icon={TrendingUp} colorClass={incomeColor} />
                <StatCard title="總支出" value={summary.expense} icon={TrendingDown} colorClass={expenseColor} />
                <StatCard title="淨結餘" value={summary.balance} icon={DollarSign} colorClass={balanceColor} />
            </div>

            {/* 主要內容：表單與圓餅圖 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <NewTransactionForm db={db} userId={userId} onTransactionAdded={onTransactionAdded} />
                </div>
                <div className="lg:col-span-2">
                    <ExpenseByCategoryChart transactions={transactions} />
                </div>
            </div>
            
            {/* 趨勢圖 */}
            <div>
                <TransactionChart transactions={transactions} />
            </div>

            {/* 交易紀錄表格 */}
            <div>
                {loadingTransactions ? (
                    <div className="text-center p-8 bg-white rounded-xl shadow-lg text-gray-500">
                        <svg className="animate-spin h-5 w-5 text-indigo-600 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        正在從雲端載入交易記錄...
                    </div>
                ) : (
                    <TransactionTable 
                        transactions={filteredAndSortedTransactions} 
                        filter={filter} setFilter={setFilter}
                        sort={sort} setSort={setSort}
                        db={db} userId={userId}
                        onTransactionDeleted={onTransactionAdded}
                    />
                )}
            </div>
        </div>
    );
};


// --- 主應用程式組件 (App) ---
const App = () => {
    // 狀態管理：Firebase、數據、頁面導航
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [firebaseStatus, setFirebaseStatus] = useState('初始化中...');
    const [transactions, setTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(true);
    const [currentPage, setCurrentPage] = useState('market'); // 預設頁面為 Market
    
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    // Firebase 初始化與身份驗證 (與原文件相同)
    useEffect(() => {
        try {
            const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
            const app = initializeApp(firebaseConfig);
            const firestoreDb = getFirestore(app);
            const firebaseAuth = getAuth(app);

            setDb(firestoreDb);
            setAuth(firebaseAuth);

            const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
                if (user) {
                    setUserId(user.uid);
                    setFirebaseStatus(`已連線 | 用戶 ID: ${user.uid.substring(0, 8)}...`);
                } else {
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
            // Fallback for transactions data is handled by the loading state
        }
    }, []);

    // 實時獲取交易數據 (onSnapshot)
    useEffect(() => {
        if (!db || !userId) return;

        setLoadingTransactions(true);
        const transactionsRef = collection(db, `artifacts/${appId}/users/${userId}/transactions`);
        
        const q = query(transactionsRef, orderBy("timestamp", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedTransactions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
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

    // 處理交易新增或刪除後的動作 (用於傳遞給 MarketView/FinanceDashboard)
    const handleDataUpdate = useCallback(() => {
        console.log("Data update triggered (add/delete).");
        // onSnapshot 會自動處理 transactions 狀態更新，此處無需額外邏輯
    }, []);
    
    // 渲染當前頁面
    const renderPage = () => {
        switch (currentPage) {
            case 'market':
                return (
                    <MarketView 
                        db={db} 
                        userId={userId} 
                        onTransactionAdded={handleDataUpdate} 
                    />
                );
            case 'finance':
                return (
                    <FinanceDashboard 
                        db={db} 
                        userId={userId} 
                        transactions={transactions} 
                        loadingTransactions={loadingTransactions}
                        onTransactionAdded={handleDataUpdate} 
                    />
                );
            default:
                return null;
        }
    };

    const getNavButtonClass = (page) => 
        `flex items-center px-4 py-2 rounded-lg font-semibold transition-colors ${
            currentPage === page 
            ? 'bg-indigo-600 text-white shadow-lg' 
            : 'text-gray-600 hover:bg-gray-100'
        }`;
    
    // 渲染購物車中的商品數量
    const cartItemCount = transactions.filter(t => t.category === '網路菜市場購物').length;


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
                {/* 標頭與導航 */}
                <header className="mb-8 border-b pb-4">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center">
                            <Home className="w-7 h-7 mr-3 text-indigo-600"/>
                            IGB 網路菜市場
                        </h1>
                        {/* Firebase 狀態顯示 */}
                        <div className="flex items-center text-sm font-medium p-2 rounded-lg bg-white shadow-sm border">
                            <Database className={`w-4 h-4 mr-2 ${firebaseStatus.includes('初始化中') || firebaseStatus.includes('等待') ? 'text-yellow-500 animate-pulse' : firebaseStatus.includes('連線') ? 'text-green-600' : 'text-red-500'}`} />
                            <span className={`text-gray-700`}>{firebaseStatus}</span>
                        </div>
                    </div>
                    
                    {/* 導航列 */}
                    <nav className="flex space-x-4 bg-white p-2 rounded-xl shadow-md">
                        <button 
                            className={getNavButtonClass('market')} 
                            onClick={() => setCurrentPage('market')}
                        >
                            <ShoppingCart className="w-5 h-5 mr-2" />
                            網路市場 (購物)
                            {cartItemCount > 0 && (
                                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                                    {cartItemCount}
                                </span>
                            )}
                        </button>
                        <button 
                            className={getNavButtonClass('finance')} 
                            onClick={() => setCurrentPage('finance')}
                        >
                            <DollarSign className="w-5 h-5 mr-2" />
                            財務儀表板 (報表)
                        </button>
                    </nav>
                </header>

                {/* 頁面內容渲染 */}
                {renderPage()}
                
                {/* 底部顯示完整 User ID */}
                <footer className="mt-8 text-center text-sm text-gray-500 border-t pt-4">
                    {userId && <p>當前用戶 ID (用於數據隔離/識別): <span className="font-mono text-gray-700 break-all">{userId}</span></p>}
                </footer>
            </div>
        </div>
    );
};

export default App;
