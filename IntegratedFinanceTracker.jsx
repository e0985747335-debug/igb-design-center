import React, { useState, useMemo } from 'react';
import {
  ShoppingCart, LayoutDashboard, DollarSign, TrendingUp, TrendingDown, Package, CreditCard, PieChart,
  PlusCircle, Clock
} from 'lucide-react';

// --- 靜態會計科目定義 (已更新為更詳細的企業級清單) ---
const ACCOUNT_SUBJECTS = {
  Income: [
    '主營業務收入 (Core Sales Revenue)',
    '服務費收入 (Service Fees)',
    '利息收入 (Interest Income)',
    '租賃收入 (Rental Income)',
    '政府補助金 (Government Grants)',
    '處分資產利得 (Gain on Asset Disposal)',
    '投資收益 (Investment Income)',
    '雜項收入 (Miscellaneous Income)',
  ],
  Expense: [
    // 營運費用類
    '辦公室租金 (Office Rent)',
    '水電瓦斯費 (Utilities)',
    '網路/電信費 (Internet/Telecom)',
    '文具用品費 (Office Supplies)',
    '設備維修費 (Equipment Maintenance)',
    '保險費 (Insurance Expense)',
    '折舊費用 (Depreciation Expense - Mock)',
    '行政管理費用 (Administrative Fees)',

    // 人事費用類
    '薪資費用 (Salaries Expense)',
    '員工福利費 (Employee Benefits)',

    // 銷售費用類
    '廣告/行銷費 (Advertising/Marketing)',
    '業務交際費 (Entertainment Expense)',
    '差旅交通費 (Travel/Transportation)',
    '郵費/快遞費 (Postage/Courier)',

    // 雜項/金融費用類
    '銀行手續費 (Bank Fees)',
    '雜項支出 (Miscellaneous Expense)',
  ]
};

// --- 初始數據定義 ---
const INITIAL_CAPITAL = 50000;
const initialMarketItems = [
  { id: 1, name: '新鮮蘋果', price: 50, cost: 30, stock: 15, emoji: '🍎', unit: '顆', taxRate: 0.05, marketingCostPerUnit: 2, perishabilityDays: 7 },
  { id: 2, name: '有機菠菜', price: 40, cost: 25, stock: 20, emoji: '🥬', unit: '把', taxRate: 0.05, marketingCostPerUnit: 1, perishabilityDays: 3 },
  { id: 3, name: '當季香蕉', price: 35, cost: 20, stock: 10, emoji: '🍌', unit: '串', taxRate: 0.05, marketingCostPerUnit: 1.5, perishabilityDays: 5 },
  { id: 4, name: '土雞雞蛋', price: 80, cost: 50, stock: 50, emoji: '🥚', unit: '盒', taxRate: 0.10, marketingCostPerUnit: 5, perishabilityDays: 14 },
];

// --- 輔助函式: 格式化日期 ---
const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-TW', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });
};

// --- KPI Card Component ---
const KPICard = ({ title, value, icon: Icon, colorClass, delta, unit = '' }) => {
  const displayValue = Math.round(value);
  const displayDelta = Math.round(delta || 0);

  return (
    <div className={`p-4 rounded-xl shadow-lg transition duration-300 transform hover:scale-[1.02] ${colorClass} text-white`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium opacity-80">{title}</h3>
        <Icon className="w-5 h-5 opacity-70" />
      </div>
      <div className="mt-2 flex justify-between items-end">
        <span className="text-3xl font-bold">
          ${displayValue.toLocaleString()}
          {unit && <span className="text-base ml-1 opacity-80">{unit}</span>}
        </span>
        {delta !== undefined && (
          <span className={`text-sm font-semibold flex items-center ${displayDelta >= 0 ? 'text-green-300' : 'text-red-300'}`}>
            {displayDelta >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {Math.abs(displayDelta).toLocaleString()}%
          </span>
        )}
      </div>
    </div>
  );
};

// --- Dashboard Component ---
const FinancialDashboard = ({ financials, inventoryValue, operatingProfit, currentCapital }) => {
  const kpis = [
    { title: '總收入 (含稅)', value: financials.grossRevenue, icon: DollarSign, colorClass: 'bg-blue-600', delta: 15 },
    { title: '營業淨利 (Operating Profit)', value: operatingProfit, icon: TrendingUp, colorClass: 'bg-green-600', delta: operatingProfit >= 0 ? 20 : -10 },
    { title: '銷貨成本 (COGS)', value: financials.costOfGoodsSold, icon: TrendingDown, colorClass: 'bg-red-500', delta: -5 },
    { title: '銷項稅額 (Tax Liability)', value: financials.salesTaxCollected, icon: PieChart, colorClass: 'bg-indigo-600', delta: 8 },
    { title: '總行銷/營運費用', value: financials.totalMarketingCost + financials.customExpenses, icon: Package, colorClass: 'bg-yellow-600', delta: 5 },
  ];

  const secondaryKpis = [
    { title: '流動資金 (Capital)', value: currentCapital, icon: CreditCard, colorClass: 'bg-purple-600', delta: 10 },
    { title: '庫存價值 (Inventory)', value: inventoryValue, icon: Package, colorClass: 'bg-teal-600', delta: 5 },
  ];

  const transactionData = [
    { name: '收入', amount: financials.grossRevenue + financials.customIncomes, color: 'bg-blue-500' },
    { name: '費用', amount: financials.costOfGoodsSold + financials.totalMarketingCost + financials.customExpenses, color: 'bg-red-500' },
    { name: '稅額', amount: financials.salesTaxCollected, color: 'bg-indigo-500' },
  ];

  const totalAmount = transactionData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <section className="space-y-6">
      <div className="flex items-center text-gray-800">
        <LayoutDashboard className="w-6 h-6 mr-2" />
        <h2 className="text-2xl font-semibold">整合財務儀表板 (進階)</h2>
      </div>

      {/* Primary Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {secondaryKpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Mock Bar Chart Visualization */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-lg font-medium mb-4 text-gray-700">財務活動概覽 (總交易筆數: {financials.totalTransactions})</h3>
        <div className="h-40 flex items-end space-x-4 p-2">
          {transactionData.map((data, index) => (
            <div key={index} className="flex flex-col items-center group relative h-full">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block px-3 py-1 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap">
                {data.name}: ${Math.round(data.amount).toLocaleString()}
              </div>
              <div
                className={`${data.color} w-10 rounded-t-lg transition-all duration-500`}
                style={{ height: `${Math.min(100, (data.amount / (totalAmount > 0 ? totalAmount : 1)) * 100)}%` }}
              ></div>
              <span className="mt-2 text-sm font-medium text-gray-500">{data.name}</span>
            </div>
          ))}
          <div className="flex-1 border-l ml-4 h-full border-gray-200 pl-4 flex items-center justify-center">
             <p className="text-gray-400 text-sm">淨利潤: ${Math.round(operatingProfit).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Market Item Card Component (No Change) ---
const MarketItemCard = ({ item, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const margin = ((item.price - item.cost) / item.price) * 100;

  const handleAddToCart = () => {
    if (quantity > 0 && quantity <= item.stock) {
      onAddToCart(item, quantity);
    } else if (quantity > item.stock) {
      showMessageBox('錯誤', `庫存不足！ ${item.name} 僅剩 ${item.stock} ${item.unit}。`);
    } else {
      showMessageBox('錯誤', '請輸入有效的購買數量。');
    }
  };

  // Custom Message Box function (replaces alert)
  const showMessageBox = (title, message) => {
    const modal = document.createElement('div');
    modal.className = "fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4";
    modal.innerHTML = `
      <div class="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full transform transition-all duration-300 scale-100">
        <h3 class="text-xl font-bold mb-3 text-indigo-600">${title}</h3>
        <p class="text-gray-700 whitespace-pre-line">${message.replace(/\n/g, '<br>')}</p>
        <button id="close-msg-box" class="mt-4 w-full bg-indigo-500 text-white py-2 rounded-xl font-semibold hover:bg-indigo-600 transition duration-200">確定</button>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('close-msg-box').onclick = () => {
      document.body.removeChild(modal);
    };
  };

  return (
    <div className="bg-white p-6 border border-gray-100 rounded-xl shadow-md flex flex-col transition duration-300 hover:shadow-xl">
      <div className="text-6xl text-center mb-4">{item.emoji}</div>
      <h3 className="text-xl font-semibold text-gray-800 mb-1">{item.name}</h3>

      <p className="text-xl font-medium text-gray-500 mb-1">未稅價: <span className="text-green-600 font-bold">${item.price.toFixed(0)}</span> / {item.unit}</p>
      <p className="text-2xl font-bold text-indigo-600 mb-3">
        總價 (含稅): ${(item.price * (1 + item.taxRate)).toFixed(1)}
      </p>

      <div className="text-sm text-gray-600 mb-4 space-y-1 bg-gray-50 p-3 rounded-lg border">
        <p>成本: <span className="font-mono">${item.cost.toFixed(0)}</span> | 庫存: <span className="font-mono text-blue-500">{item.stock} {item.unit}</span></p>
        <p>邊際利潤: <span className={`font-mono font-bold ${margin > 0 ? 'text-green-600' : 'text-red-600'}`}>{margin.toFixed(1)}%</span></p>
        <p>銷售稅率: <span className="font-mono text-purple-600">{(item.taxRate * 100).toFixed(0)}%</span></p>
        <p>單位行銷費: <span className="font-mono text-orange-600">${item.marketingCostPerUnit.toFixed(1)}</span></p>
        <p>保質期: <span className="font-mono text-red-500">{item.perishabilityDays} 天</span></p>
      </div>

      <div className="flex items-center space-x-2 mt-auto">
        <input
          type="number"
          min="1"
          max={item.stock}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Math.min(item.stock, Number(e.target.value))))}
          className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-center focus:ring-blue-500 focus:border-blue-500"
          disabled={item.stock === 0}
        />
        <button
          onClick={handleAddToCart}
          className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 px-3 rounded-xl font-medium text-sm transition duration-300 hover:shadow-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={item.stock === 0}
        >
          {item.stock > 0 ? '加入購物車' : '售罄'}
        </button>
      </div>
    </div>
  );
};

// --- Transaction Input Component (已更新，使用詳細科目) ---
const TransactionInput = ({ onAddTransaction }) => {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Income'); // Income or Expense
    // 預設選擇該類別的第一個科目
    const [subject, setSubject] = useState(ACCOUNT_SUBJECTS.Income[0]);

    // 處理類別變更，並重設會計科目為該類別的預設值
    const handleCategoryChange = (e) => {
        const newCategory = e.target.value;
        setCategory(newCategory);
        // 確保新類別有科目，並選擇第一個
        setSubject(ACCOUNT_SUBJECTS[newCategory] ? ACCOUNT_SUBJECTS[newCategory][0] : '');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const numAmount = Number(amount);
        if (numAmount <= 0 || !description || !subject) {
            showMessageBox('輸入錯誤', '請輸入有效的金額、描述和會計科目。');
            return;
        }

        // 傳遞 category, subject, amount, description
        onAddTransaction(category, subject, numAmount, description);
        setAmount('');
        setDescription('');
    };

    // Custom Message Box function (replaces alert)
    const showMessageBox = (title, message) => {
        const modal = document.createElement('div');
        modal.className = "fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4";
        modal.innerHTML = `
          <div class="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full transform transition-all duration-300 scale-100">
            <h3 class="text-xl font-bold mb-3 text-indigo-600">${title}</h3>
            <p class="text-gray-700 whitespace-pre-line">${message.replace(/\n/g, '<br>')}</p>
            <button id="close-msg-box" class="mt-4 w-full bg-indigo-500 text-white py-2 rounded-xl font-semibold hover:bg-indigo-600 transition duration-200">確定</button>
          </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('close-msg-box').onclick = () => {
          document.body.removeChild(modal);
        };
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                <PlusCircle className="w-5 h-5 mr-2 text-red-500"/>
                手動記錄收支 (含科目)
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* 類別和科目選擇 */}
                <div className="flex space-x-4">
                    {/* 1. 類別 (Category) */}
                    <select
                        value={category}
                        onChange={handleCategoryChange}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 flex-none w-1/3 text-gray-700 font-medium"
                    >
                        <option value="Income">收入 (Income)</option>
                        <option value="Expense">支出 (Expense)</option>
                    </select>

                    {/* 2. 會計科目 (Subject) */}
                    <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 flex-1 text-gray-700 font-medium"
                    >
                        {/* 確保 ACCOUNT_SUBJECTS[category] 存在且為陣列，以防萬一 */}
                        {(ACCOUNT_SUBJECTS[category] || []).map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>
                </div>

                {/* 金額輸入 */}
                <input
                    type="number"
                    placeholder="金額 (Amount)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    min="0.01"
                    step="0.01"
                    required
                />

                {/* 描述輸入 */}
                <input
                    type="text"
                    placeholder="描述/備註 (e.g. 一月份店面租金)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    required
                />

                {/* 提交按鈕 */}
                <button
                    type="submit"
                    className={`w-full py-3 rounded-xl font-bold text-white transition duration-200 ${
                        category === 'Income' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                    }`}
                >
                    記錄 {category === 'Income' ? '收入' : '支出'}
                </button>
            </form>
        </div>
    );
};

// --- Transaction History Component (已更新，顯示科目) ---
const TransactionHistory = ({ history }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-96 overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-gray-500"/>
            交易歷史記錄 ({history.length} 筆)
        </h3>
        {history.length === 0 ? (
            <p className="text-center text-gray-500 py-10">目前沒有交易記錄。</p>
        ) : (
            <ul className="space-y-2">
                {history.map((tx) => (
                    <li key={tx.id} className="p-3 rounded-lg border-b last:border-b-0 flex justify-between items-center hover:bg-gray-50 transition duration-150">
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-medium text-gray-900 truncate">
                                {tx.description}
                                <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                                    tx.type === 'Market Sale' ? 'bg-blue-100 text-blue-800' :
                                    (tx.category === 'Income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')
                                }`}>
                                    {tx.type === 'Market Sale' ? '市場銷售' : (tx.category === 'Income' ? '通用收入' : '通用支出')}
                                </span>
                                {/* 顯示會計科目，只取中文部分 */}
                                {tx.type === 'Custom' && tx.subject && (
                                    <span className="ml-2 text-xs font-medium text-purple-600">
                                        ({tx.subject.split(' ')[0]})
                                    </span>
                                )}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">{formatTimestamp(tx.timestamp)}</span>
                        </div>
                        <div className={`font-bold text-lg text-right ${
                            tx.type === 'Custom' && tx.category === 'Expense' ? 'text-red-600' : 'text-green-600'
                        }`}>
                            {/* 市場銷售的金額是淨收入 (GrossRevenue - Tax) */}
                            {tx.type === 'Market Sale' ? `+ $${(tx.grossRevenue - tx.taxCollected).toFixed(2)}` : `${tx.category === 'Income' ? '+' : '-'} $${tx.amount.toFixed(2)}`}
                        </div>
                    </li>
                ))}
            </ul>
        )}
    </div>
);


// --- Main Application Component ---
const App = () => {
  const [marketItems, setMarketItems] = useState(initialMarketItems);
  const [cart, setCart] = useState({}); // { itemId: quantity }
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  // --- Derived State Calculations for Cart ---
  const { cartItems, cartTotal, cartSubtotal, cartCOGS, cartTax, cartMarketingCost } = useMemo(() => {
    let totalGross = 0;
    let totalSubtotal = 0;
    let totalTax = 0;
    let totalCOGS = 0;
    let totalMarketingCost = 0;

    const items = Object.entries(cart).map(([itemId, quantity]) => {
      const item = marketItems.find(i => i.id === Number(itemId));
      if (item) {
        const subtotal = item.price * quantity;
        const taxAmount = subtotal * item.taxRate;
        const itemTotalWithTax = subtotal + taxAmount;

        const itemCOGS = item.cost * quantity;
        const itemMarketingCost = item.marketingCostPerUnit * quantity;

        totalGross += itemTotalWithTax;
        totalSubtotal += subtotal;
        totalTax += taxAmount;
        totalCOGS += itemCOGS;
        totalMarketingCost += itemMarketingCost;

        return { ...item, quantity, subtotal, taxAmount, itemTotalWithTax };
      }
      return null;
    }).filter(Boolean);

    return {
      cartItems: items,
      cartTotal: totalGross,
      cartSubtotal: totalSubtotal,
      cartCOGS: totalCOGS,
      cartTax: totalTax,
      cartMarketingCost: totalMarketingCost
    };
  }, [cart, marketItems]);


  // --- Central Aggregation of all Financial Metrics ---
  const aggregatedFinancials = useMemo(() => {
    const agg = {
      grossRevenue: 0,
      costOfGoodsSold: 0,
      salesTaxCollected: 0,
      totalMarketingCost: 0,
      customIncomes: 0,
      customExpenses: 0,
      totalTransactions: transactionHistory.length,
    };

    transactionHistory.forEach(tx => {
      if (tx.type === 'Market Sale') {
        agg.grossRevenue += tx.grossRevenue;
        agg.costOfGoodsSold += tx.cogs;
        agg.salesTaxCollected += tx.taxCollected;
        agg.totalMarketingCost += tx.marketingCost;
      } else if (tx.type === 'Custom') {
        if (tx.category === 'Income') {
            // 這裡的 customIncomes 僅用於非市場類型的通用收入。
          agg.customIncomes += tx.amount;
        } else if (tx.category === 'Expense') {
          agg.customExpenses += tx.amount;
        }
      }
    });

    // 淨收入 (不含稅) = 市場總收入 (不含稅) + 通用收入
    const netRevenue = (agg.grossRevenue - agg.salesTaxCollected) + agg.customIncomes;

    // 營業淨利 = 淨收入 - 銷貨成本 - 市場行銷費用 - 通用費用
    const operatingProfit = netRevenue - agg.costOfGoodsSold - agg.totalMarketingCost - agg.customExpenses;

    const currentCapital = INITIAL_CAPITAL + operatingProfit;

    return {
        ...agg,
        operatingProfit,
        currentCapital,
    };
  }, [transactionHistory]);

  const { operatingProfit, currentCapital } = aggregatedFinancials;

  // --- Inventory Value (庫存價值) ---
  const inventoryValue = useMemo(() => {
    return marketItems.reduce((sum, item) => sum + item.stock * item.cost, 0);
  }, [marketItems]);


  // --- Handlers ---
  const handleUpdateCartQuantity = (itemId, newQuantity) => {
    setCart(prevCart => {
      const item = marketItems.find(i => i.id === Number(itemId));
      const maxStock = item ? item.stock : 0;
      const safeQuantity = Math.min(maxStock, Math.max(0, newQuantity));

      if (safeQuantity === 0) {
        const { [itemId]: removed, ...rest } = prevCart;
        return rest;
      }

      return { ...prevCart, [itemId]: safeQuantity };
    });
  };

  // Market Checkout Handler
  const handleCheckout = () => {
    if (cartTotal === 0) {
      showMessageBox('結帳失敗', '購物車是空的，無法結帳。');
      return;
    }

    const newTransaction = {
      id: Date.now(),
      type: 'Market Sale',
      description: `市場銷售 #${transactionHistory.length + 1}`,
      grossRevenue: cartTotal, // 含稅總額
      cogs: cartCOGS,
      taxCollected: cartTax,
      marketingCost: cartMarketingCost,
      timestamp: Date.now(),
    };

    // 1. Record Transaction
    setTransactionHistory(prev => [newTransaction, ...prev]);

    // 2. Update Market Inventory
    setMarketItems(prevItems => prevItems.map(item => {
      const purchasedQuantity = cart[item.id] || 0;
      if (purchasedQuantity > 0) {
        return { ...item, stock: item.stock - purchasedQuantity };
      }
      return item;
    }));

    // 3. Clear Cart and Notify
    setCart({});
    setIsCheckoutModalOpen(false);
    const transactionNetProfit = cartTotal - cartCOGS - cartTax - cartMarketingCost;
    const message = `成功交易！\n\n- 客戶付款總額 (含稅)：$${cartTotal.toFixed(2)}\n- 銷貨成本：$${cartCOGS.toFixed(2)}\n- 銷項稅額：$${cartTax.toFixed(2)}\n- 行銷費用：$${cartMarketingCost.toFixed(2)}\n--------------------------------\n- 交易淨利：$${transactionNetProfit.toFixed(2)}`;
    showMessageBox('交易完成', message);
  };

  // Custom Transaction Handler (已更新，接受 subject)
  const handleCustomTransaction = (category, subject, amount, description) => {
    const newTransaction = {
      id: Date.now() + Math.random(),
      type: 'Custom',
      category: category, // 'Income' or 'Expense'
      subject: subject, // 會計科目
      amount: amount,
      description: description,
      timestamp: Date.now(),
    };
    setTransactionHistory(prev => [newTransaction, ...prev]);
    showMessageBox('記錄成功', `${subject.split(' ')[0]} ${category === 'Income' ? '收入' : '支出'} $${amount.toFixed(2)} 已記錄。`);
  };


  // Custom Message Box function (replaces alert)
  const showMessageBox = (title, message) => {
    const modal = document.createElement('div');
    modal.className = "fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4";
    modal.innerHTML = `
      <div class="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full transform transition-all duration-300 scale-100">
        <h3 class="text-xl font-bold mb-3 text-indigo-600">${title}</h3>
        <p class="text-gray-700 whitespace-pre-line">${message.replace(/\n/g, '<br>')}</p>
        <button id="close-msg-box" class="mt-4 w-full bg-indigo-500 text-white py-2 rounded-xl font-semibold hover:bg-indigo-600 transition duration-200">確定</button>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('close-msg-box').onclick = () => {
      document.body.removeChild(modal);
    };
  };


  // --- Cart Modal Component ---
  const CartModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="p-5 border-b sticky top-0 bg-white rounded-t-xl z-10">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <ShoppingCart className="w-6 h-6 mr-2 text-indigo-500" />
              購物車 ({cartItems.length} 項)
            </h2>
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-3xl">
              &times;
            </button>
          </div>

          {/* Modal Body (Cart Items) */}
          <div className="p-5 space-y-4">
            {cartItems.length === 0 ? (
              <p className="text-center text-gray-500 py-10">購物車內沒有商品。</p>
            ) : (
              cartItems.map(item => (
                <div key={item.id} className="flex justify-between items-center border-b pb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{item.emoji}</span>
                    <div>
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500">未稅單價: ${item.price.toFixed(1)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      min="1"
                      max={item.stock}
                      value={item.quantity}
                      onChange={(e) => handleUpdateCartQuantity(item.id, Number(e.target.value))}
                      className="w-14 px-1 py-1 border border-gray-300 rounded-lg text-center text-sm"
                    />
                    <span className="font-bold text-lg text-indigo-600">${item.itemTotalWithTax.toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Modal Footer (Summary & Checkout) */}
          <div className="p-5 bg-gray-50 rounded-b-xl sticky bottom-0 border-t">
            <div className="space-y-1 mb-4 text-sm font-medium text-gray-700">
                <div className="flex justify-between">
                    <span>商品小計 (未稅):</span>
                    <span>${cartSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>銷項稅額 ({ (cartTax / cartSubtotal * 100 || 0).toFixed(1) }% 平均):</span>
                    <span className='text-purple-600'>+ ${cartTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 text-gray-800 border-t border-gray-200">
                    <span>客戶支付總額 (含稅):</span>
                    <span className="text-red-600">${cartTotal.toFixed(2)}</span>
                </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cartTotal === 0}
              className="w-full bg-green-500 text-white py-3 rounded-xl font-bold text-lg transition duration-300 hover:bg-green-600 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              確認結帳 (${cartTotal.toFixed(2)})
            </button>
          </div>
        </div>
      </div>
    );
  };


  // --- Render App ---
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-extrabold text-indigo-700 flex items-center">
            <img src="https://placehold.co/32x32/indigo/white?text=I" alt="IGB Icon" className="mr-2 rounded-full"/>
            IGB 整合財務追蹤器
            <span className="text-base font-normal ml-3 text-gray-500 hidden sm:inline">(市場模擬與通用收支)</span>
          </h1>
          <button
            onClick={() => setIsCheckoutModalOpen(true)}
            className="relative p-2 bg-indigo-500 text-white rounded-full transition duration-300 hover:bg-indigo-600 shadow-md"
          >
            <ShoppingCart className="w-6 h-6" />
            {cartItems.length > 0 && (
              <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-white">
                {cartItems.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* Financial Dashboard Section */}
        <FinancialDashboard
          financials={aggregatedFinancials}
          inventoryValue={inventoryValue}
          operatingProfit={operatingProfit}
          currentCapital={currentCapital}
        />

        {/* Tracker Tools & History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                {/* 傳遞新的 handleCustomTransaction 函數，它現在需要 subject 參數 */}
                <TransactionInput onAddTransaction={handleCustomTransaction} />
            </div>
            <div className="lg:col-span-2">
                <TransactionHistory history={transactionHistory} />
            </div>
        </div>

        {/* Market Simulation Section (The original IGB Online Market functionality) */}
        <div className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <Package className="w-6 h-6 mr-2 text-green-600"/>
                市場商品列表 (原始 IGB 網購模擬)
            </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {marketItems.map((item) => (
              <MarketItemCard key={item.id} item={item} onAddToCart={handleUpdateCartQuantity} />
            ))}
          </div>
        </div>
      </main>

      {/* Cart Modal */}
      <CartModal isOpen={isCheckoutModalOpen} onClose={() => setIsCheckoutModalOpen(false)} />
    </div>
  );
};

export default App;
