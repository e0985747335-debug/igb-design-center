import React, { useState, useEffect } from "react";

// --- 模擬資料 (mock data) ---
const mockFinanceStats = {
  revenue: 1850000,
  expenses: 940000,
  profit: 910000,
  cashflow: 670000,
};

const mockTransactions = [
  { id: 1, category: "銷售收入", amount: 120000, date: "2025-10-20" },
  { id: 2, category: "設備採購", amount: -30000, date: "2025-10-22" },
  { id: 3, category: "員工薪資", amount: -150000, date: "2025-10-25" },
  { id: 4, category: "顧問費用", amount: -20000, date: "2025-10-26" },
  { id: 5, category: "專案付款", amount: 85000, date: "2025-10-27" },
];

// --- 工具函式 ---
function formatCurrency(num) {
  return "NT$" + num.toLocaleString();
}

export default function FinanceDashboard() {
  const [financeStats, setFinanceStats] = useState(mockFinanceStats);
  const [transactions, setTransactions] = useState(mockTransactions);

  useEffect(() => {
    console.log("FinanceDashboard loaded");
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">財務儀表板</h1>
        <button
          onClick={() => alert("資料更新中...")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm"
        >
          更新資料
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="營收" value={financeStats.revenue} color="text-green-600" />
        <KpiCard title="支出" value={financeStats.expenses} color="text-red-600" />
        <KpiCard title="利潤" value={financeStats.profit} color="text-blue-600" />
        <KpiCard title="現金流" value={financeStats.cashflow} color="text-yellow-600" />
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">最近交易紀錄</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                類別
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                金額
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                日期
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 text-sm text-gray-700">{tx.category}</td>
                <td
                  className={`px-6 py-3 text-sm text-right font-medium ${
                    tx.amount >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(tx.amount)}
                </td>
                <td className="px-6 py-3 text-sm text-right text-gray-500">
                  {tx.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KpiCard({ title, value, color }) {
  return (
    <div className="bg-white shadow rounded-xl p-5 flex flex-col space-y-2">
      <span className="text-sm text-gray-500">{title}</span>
      <span className={`text-xl font-semibold ${color}`}>{formatCurrency(value)}</span>
    </div>
  );
}
