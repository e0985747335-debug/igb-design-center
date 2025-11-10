import React, { useState, useMemo, useEffect } from 'react';
import { Search, User, Phone, Mail, MapPin, Grid, Briefcase } from 'lucide-react';

// 模擬廠商資料
const initialVendors = [
  { id: 'V001', name: '大同電子有限公司', contact: '王小明', phone: '02-12345678', email: 'tatung@example.com', address: '台北市大安區' },
  { id: 'V002', name: '東元電機股份有限公司', contact: '陳美玲', phone: '03-98765432', email: 'teco@example.com', address: '新北市中和區' },
  { id: 'V003', name: '華碩電腦', contact: '林志豪', phone: '07-23450000', email: 'asus@example.com', address: '高雄市前鎮區' },
  { id: 'V004', name: '聯強國際', contact: '張雅婷', phone: '04-87654321', email: 'synnex@example.com', address: '台中市西屯區' },
  { id: 'V005', name: '廣達電腦股份有限公司', contact: '吳宗憲', phone: '03-34567890', email: 'quanta@example.com', address: '桃園市龜山區' },
  { id: 'V006', name: '鴻海精密工業', contact: '蔡依林', phone: '08-11223344', email: 'foxconn@example.com', address: '新北市土城區' },
  { id: 'V007', name: '台積電', contact: '周杰倫', phone: '06-56781234', email: 'tsmc@example.com', address: '台南市善化區' },
  { id: 'V008', name: '聯發科技', contact: '徐若瑄', phone: '05-99887766', email: 'mediatek@example.com', address: '新竹市東區' },
  { id: 'V009', name: '友達光電', contact: '羅志祥', phone: '04-10293847', email: 'auo@example.com', address: '新竹縣寶山鄉' },
];

// 單一廠商卡片組件 (用於手機響應式視圖)
const VendorCard = ({ vendor }) => (
  <div className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition duration-300 border border-gray-100">
    <div className="flex items-center justify-between mb-2 pb-2 border-b border-indigo-100">
      <div className="flex items-center">
        <Briefcase className="w-5 h-5 text-indigo-500 mr-2" />
        <p className="text-lg font-bold text-gray-800">{vendor.name}</p>
      </div>
      <span className="text-xs font-semibold px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">{vendor.id}</span>
    </div>
    <div className="space-y-2 text-sm text-gray-600">
      <p className="flex items-center"><User className="w-4 h-4 text-gray-400 mr-2" /> 聯絡人: {vendor.contact}</p>
      <p className="flex items-center"><Phone className="w-4 h-4 text-gray-400 mr-2" /> 電話: {vendor.phone}</p>
      <p className="flex items-center"><Mail className="w-4 h-4 text-gray-400 mr-2" /> 信箱: {vendor.email}</p>
      <p className="flex items-center"><MapPin className="w-4 h-4 text-gray-400 mr-2" /> 地址: {vendor.address}</p>
    </div>
  </div>
);

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [vendors, setVendors] = useState(initialVendors);
  
  // 為了模擬實際環境，我們會將 Firestore 相關的變數留空，並使用初始數據
  // 實際應用中，您會在這裡初始化 Firebase 並取得數據
  const db = null; 
  const auth = null;
  const userId = 'mock-user-id';
  const appId = 'vendor-query-app';
  const isAuthReady = true;

  // 使用 useMemo 進行高效能的過濾
  const filteredVendors = useMemo(() => {
    if (!searchTerm) {
      return vendors;
    }
    const lowerCaseSearch = searchTerm.toLowerCase();

    return vendors.filter(vendor =>
      // 模糊查詢：檢查 ID, 名稱, 聯絡人
      vendor.id.toLowerCase().includes(lowerCaseSearch) ||
      vendor.name.toLowerCase().includes(lowerCaseSearch) ||
      vendor.contact.toLowerCase().includes(lowerCaseSearch)
    );
  }, [vendors, searchTerm]);

  // 處理查詢輸入變更
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center mb-2">
          <Grid className="w-7 h-7 text-indigo-600 mr-3" />
          廠商資料查詢
        </h1>
        <p className="text-gray-500">輸入廠商編號、名稱或聯絡人以查詢資料。</p>
      </header>

      {/* 查詢輸入框 */}
      <div className="mb-8 p-4 bg-white rounded-xl shadow-md border border-indigo-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="請輸入廠商編號、名稱或聯絡人進行查詢..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full py-3 pl-12 pr-4 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          已找到 {filteredVendors.length} 筆符合 <span className="font-semibold text-indigo-600">"{searchTerm}"</span> 的結果。
        </p>
      </div>

      {/* 廠商列表顯示 */}
      <main>
        {filteredVendors.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">查無資料</h3>
            <p className="text-gray-500 mt-2">請嘗試使用不同的關鍵字。</p>
          </div>
        )}

        {/* 桌面版表格 */}
        <div className="hidden md:block bg-white rounded-xl shadow-xl overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-indigo-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider rounded-tl-xl">廠商編號</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">廠商名稱</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">聯絡人</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">電話/信箱</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider rounded-tr-xl">地址</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredVendors.map((vendor, index) => (
                <tr key={vendor.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50 transition duration-150`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-indigo-600">{vendor.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vendor.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{vendor.contact}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <p className="flex items-center"><Phone className="w-3 h-3 mr-1 text-gray-500"/> {vendor.phone}</p>
                    <p className="flex items-center"><Mail className="w-3 h-3 mr-1 text-gray-500"/> {vendor.email}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{vendor.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 手機版卡片視圖 */}
        <div className="md:hidden space-y-4">
          {filteredVendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;
