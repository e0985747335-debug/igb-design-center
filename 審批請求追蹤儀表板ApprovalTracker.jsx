import React, { useState, useMemo } from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle, Search, Filter } from 'lucide-react'; // Assuming lucide-react is available

// --- 模擬數據 ---
const MOCK_REQUESTS = [
  { id: 'REQ-1001', subject: '採購新伺服器', requester: '王小明', status: 'Approved', daysInStatus: 3 },
  { id: 'REQ-1002', subject: '行銷活動預算審批', requester: '陳大華', status: 'Pending', daysInStatus: 7 },
  { id: 'REQ-1003', subject: '新員工入職權限', requester: '林美玲', status: 'Stalled', daysInStatus: 15 }, // 卡住！
  { id: 'REQ-1004', subject: '軟體訂閱續期', requester: '張文傑', status: 'Approved', daysInStatus: 1 },
  { id: 'REQ-1005', subject: '辦公室佈局變更', requester: '黃雅雯', status: 'Rejected', daysInStatus: 2 },
  { id: 'REQ-1006', subject: '開發工具購買', requester: '王小明', status: 'Stalled', daysInStatus: 22 }, // 卡住！
  { id: 'REQ-1007', subject: '季度績效報告審批', requester: '李志剛', status: 'Pending', daysInStatus: 1 },
  { id: 'REQ-1008', subject: '雲服務升級', requester: '陳大華', status: 'Stalled', daysInStatus: 10 }, // 卡住！
];

// --- 狀態配置和工具函數 ---

// 狀態文字和 Tailwind 顏色映射
const STATUS_CONFIG = {
  'Approved': { text: '已批准', color: 'bg-green-100 text-green-800 border-green-400', icon: CheckCircle },
  'Pending': { text: '待審批', color: 'bg-yellow-100 text-yellow-800 border-yellow-400', icon: Clock },
  'Rejected': { text: '已拒絕', color: 'bg-red-100 text-red-800 border-red-400', icon: XCircle },
  'Stalled': { text: '卡住 (Stuck!)', color: 'bg-orange-100 text-orange-800 border-orange-400 font-bold animate-pulse', icon: AlertTriangle },
};

/**
 * 獲取狀態徽章的樣式和圖標
 * @param {string} status
 * @returns {object}
 */
const getStatusBadge = (status) => {
  return STATUS_CONFIG[status] || { text: '未知', color: 'bg-gray-100 text-gray-800 border-gray-400', icon: AlertTriangle };
};

// --- 組件 ---

/**
 * 審批請求卡片/行組件
 * @param {object} props - 包含請求數據
 */
const RequestRow = ({ request }) => {
  const { id, subject, requester, status, daysInStatus } = request;
  const badge = getStatusBadge(status);
  const Icon = badge.icon;
  const isStalled = status === 'Stalled';

  return (
    <div className={`
      p-4 mb-3 rounded-xl shadow-md transition-all duration-300
      ${isStalled ? 'bg-white ring-2 ring-orange-500 hover:shadow-xl' : 'bg-white hover:bg-gray-50 hover:shadow-lg'}
      md:grid md:grid-cols-5 md:gap-4 items-center
    `}>
      {/* 請求ID - Mobile Top */}
      <div className="md:col-span-1 text-sm font-semibold text-gray-700 mb-2 md:mb-0">
        <span className="md:hidden text-gray-500 mr-2">ID:</span>
        {id}
      </div>

      {/* 主題/摘要 */}
      <div className="md:col-span-2 text-base font-medium text-gray-900 truncate mb-2 md:mb-0">
        {subject}
      </div>

      {/* 請求人 - Mobile */}
      <div className="flex items-center text-sm text-gray-600 mb-2 md:mb-0 md:hidden">
        <span className="font-medium mr-2">請求人:</span> {requester}
      </div>

      {/* 狀態徽章 */}
      <div className="md:col-span-1 flex justify-start md:justify-center mb-2 md:mb-0">
        <span className={`
          inline-flex items-center px-3 py-1 text-xs leading-4 font-medium rounded-full border
          ${badge.color}
        `}>
          <Icon className="w-3 h-3 mr-1" />
          {badge.text}
        </span>
      </div>

      {/* 狀態持續時間 */}
      <div className={`
        md:col-span-1 flex items-center text-sm font-medium
        ${isStalled ? 'text-orange-600' : 'text-gray-500'}
      `}>
        <Clock className="w-4 h-4 mr-1" />
        {daysInStatus} 天
        {isStalled && (
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-orange-500 text-white shadow-sm">
            超時
          </span>
        )}
      </div>

      {/* 請求人 - Desktop Only */}
      <div className="hidden md:block absolute right-4 top-4 text-sm text-gray-600">
        {requester}
      </div>
    </div>
  );
};

/**
 * 主要應用程式組件
 */
const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // 計算並過濾請求
  const filteredRequests = useMemo(() => {
    return MOCK_REQUESTS
      .filter(request => {
        // 1. 狀態過濾
        const statusMatch = statusFilter === 'All' || request.status === statusFilter;

        // 2. 搜尋過濾 (ID, Subject, Requester)
        const lowerCaseSearch = searchTerm.toLowerCase();
        const searchMatch = request.id.toLowerCase().includes(lowerCaseSearch) ||
                            request.subject.toLowerCase().includes(lowerCaseSearch) ||
                            request.requester.toLowerCase().includes(lowerCaseSearch);

        return statusMatch && searchMatch;
      })
      .sort((a, b) => {
        // 將 'Stalled' 的請求排在最前面
        if (a.status === 'Stalled' && b.status !== 'Stalled') return -1;
        if (a.status !== 'Stalled' && b.status === 'Stalled') return 1;
        // 其次按天數降序排列
        return b.daysInStatus - a.daysInStatus;
      });
  }, [searchTerm, statusFilter]);

  const totalStalled = MOCK_REQUESTS.filter(r => r.status === 'Stalled').length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 font-['Inter']">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 border-b pb-2">
          審批請求追蹤儀表板
        </h1>
        <p className="text-gray-600">
          總覽所有工作流程請求狀態，並重點標註「卡住」的項目。
        </p>
      </header>

      {/* 狀態卡片摘要 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* 卡住/Stalled 摘要卡片 */}
        <div className="p-5 bg-orange-500 text-white rounded-xl shadow-lg transform hover:scale-[1.02] transition duration-300">
          <div className="flex items-center justify-between">
            <AlertTriangle className="w-8 h-8 opacity-90" />
            <span className="text-4xl font-bold">{totalStalled}</span>
          </div>
          <p className="text-sm mt-2 font-semibold">卡住 (Stuck) 請求</p>
        </div>

        {/* 其他狀態摘要 (可擴展) */}
        {Object.keys(STATUS_CONFIG).filter(s => s !== 'Stalled').map(statusKey => {
          const config = STATUS_CONFIG[statusKey];
          const CountIcon = config.icon;
          const count = MOCK_REQUESTS.filter(r => r.status === statusKey).length;
          const bgClass = statusKey === 'Approved' ? 'bg-green-50' : statusKey === 'Pending' ? 'bg-yellow-50' : 'bg-red-50';
          const textClass = statusKey === 'Approved' ? 'text-green-800' : statusKey === 'Pending' ? 'text-yellow-800' : 'text-red-800';

          return (
            <div key={statusKey} className={`p-5 ${bgClass} ${textClass} rounded-xl shadow-md`}>
              <div className="flex items-center justify-between">
                <CountIcon className="w-6 h-6" />
                <span className="text-3xl font-bold">{count}</span>
              </div>
              <p className="text-sm mt-2 font-semibold">{config.text}</p>
            </div>
          );
        })}
      </div>

      {/* 過濾和搜尋區 */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* 搜尋欄 */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜尋 ID, 主題 或 請求人..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* 狀態過濾下拉選單 */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <select
              className="w-full sm:w-48 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">所有狀態</option>
              {Object.keys(STATUS_CONFIG).map(statusKey => (
                <option key={statusKey} value={statusKey}>{STATUS_CONFIG[statusKey].text}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>
      </div>


      {/* 請求列表 */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        請求列表 ({filteredRequests.length} 筆)
      </h2>

      {/* 桌面版表頭 */}
      <div className="hidden md:grid md:grid-cols-5 md:gap-4 font-semibold text-sm text-gray-500 uppercase px-4 py-2 mb-2 border-b border-gray-200">
        <div className="col-span-1">請求 ID</div>
        <div className="col-span-2">主題/摘要</div>
        <div className="col-span-1 text-center">狀態</div>
        <div className="col-span-1">持續時間</div>
      </div>

      {/* 渲染請求列表 */}
      <div className="space-y-3">
        {filteredRequests.length > 0 ? (
          filteredRequests.map(request => (
            <RequestRow key={request.id} request={request} />
          ))
        ) : (
          <div className="text-center p-10 bg-white rounded-xl shadow-lg text-gray-500">
            找不到符合條件的請求。
          </div>
        )}
      </div>

      {/* 底部說明 */}
      <footer className="mt-10 pt-4 border-t border-gray-200 text-center text-sm text-gray-400">
        * 數據為模擬，專為突顯「卡住 (Stalled)」狀態設計。
      </footer>
    </div>
  );
};

export default App;
