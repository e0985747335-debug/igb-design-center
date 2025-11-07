import React, { useState, useEffect, useCallback } from 'react';
import { Menu, X, Rocket, LayoutGrid, BarChart3, Settings } from 'lucide-react';

// 模組 1: 導航列 (Navigation Bar Component)
const NavBar = ({ isMenuOpen, toggleMenu, navItems, activeItem, setActiveItem }) => (
  <header className="bg-white shadow-md sticky top-0 z-40">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        {/* 標誌/應用名稱 */}
        <div className="flex items-center">
          <Rocket className="w-6 h-6 text-indigo-600 mr-2" />
          <span className="text-xl font-bold text-gray-900">
            UI/UX 應用程式
          </span>
        </div>

        {/* 桌面版導航 */}
        <nav className="hidden md:flex space-x-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out 
                ${activeItem === item.id 
                  ? 'bg-indigo-500 text-white shadow-lg' 
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`
              }
            >
              {item.name}
            </button>
          ))}
        </nav>

        {/* 行動版選單按鈕 */}
        <div className="md:hidden flex items-center">
          <button
            onClick={toggleMenu}
            type="button"
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            aria-expanded={isMenuOpen}
          >
            <span className="sr-only">打開主選單</span>
            {isMenuOpen ? (
              <X className="block h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="block h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>

    {/* 行動版選單內容 */}
    <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden bg-gray-50 border-t border-gray-200`}>
      <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveItem(item.id);
              toggleMenu(); // 點擊後關閉選單
            }}
            className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition duration-150 ease-in-out
              ${activeItem === item.id 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'}`
            }
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  </header>
);

// 模組 2: 頁面內容區塊 (Page Content Component)
const ContentSection = ({ title, icon: Icon, children }) => (
  <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100">
    <div className="flex items-center mb-4 border-b pb-3">
      {Icon && <Icon className="w-6 h-6 text-indigo-600 mr-3" />}
      <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
    </div>
    {children}
  </div>
);

// 模組 3: 響應式卡片列表 (Card List Component)
const Card = ({ title, description, color }) => (
  <div className={`p-5 rounded-xl shadow-lg transition duration-300 hover:shadow-xl transform hover:-translate-y-1 ${color}`}>
    <h3 className="text-lg font-semibold mb-2 text-gray-900">{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
  </div>
);

const CardList = () => {
  const data = [
    { title: "模組化設計", description: "將介面拆分為可重用的元件，提高開發效率。", color: "bg-blue-100 border-l-4 border-blue-500" },
    { title: "一致性佈局", description: "確保顏色、字體、間距在整個應用程式中保持一致。", color: "bg-green-100 border-l-4 border-green-500" },
    { title: "可訪問性考量", description: "優化鍵盤導航和螢幕閱讀器兼容性，讓所有使用者都能使用。", color: "bg-yellow-100 border-l-4 border-yellow-500" },
    { title: "視覺層次感", description: "利用字體大小、顏色和留白來引導使用者注意重要資訊。", color: "bg-red-100 border-l-4 border-red-500" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {data.map((item, index) => (
        <Card key={index} {...item} />
      ))}
    </div>
  );
};

// 主要應用程式元件 (Main Application Component)
const App = () => {
  const [activeItem, setActiveItem] = useState('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', name: '儀表板', icon: BarChart3 },
    { id: 'settings', name: '設定', icon: Settings },
    { id: 'data', name: '資料管理', icon: LayoutGrid },
  ];

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  // 根據 activeItem 渲染對應的頁面內容
  const renderContent = () => {
    switch (activeItem) {
      case 'dashboard':
        return (
          <ContentSection title="儀表板總覽" icon={BarChart3}>
            <p className="text-gray-600 mb-6">
              這是應用程式的核心視圖，專注於提供使用者最關鍵的資訊和操作入口。在響應式設計中，我們確保在小螢幕上也能保持資訊的優先級。
            </p>
            <CardList />
            <div className="mt-8">
                <h3 className="text-xl font-medium text-gray-800 mb-3">優化重點：行動優先</h3>
                <p className="text-gray-600">
                    在行動裝置上，主要導航（NavBar）會自動變成一個漢堡選單，確保螢幕空間最大化。卡片列表 (CardList) 則會從四欄佈局自動收縮成單欄或兩欄佈局，提升可讀性。
                </p>
            </div>
          </ContentSection>
        );
      case 'settings':
        return (
          <ContentSection title="應用程式設定" icon={Settings}>
            <p className="text-gray-600">
              設定頁面通常包含表單輸入。良好的 UX 要求表單清晰、標籤明確且提供即時反饋。
            </p>
            {/* 範例表單元素 */}
            <div className="mt-4 space-y-4 max-w-lg">
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">使用者名稱</label>
                    <input 
                        type="text" 
                        id="username" 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" 
                        placeholder="輸入您的名稱" 
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">電子郵件</label>
                    <input 
                        type="email" 
                        id="email" 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" 
                        placeholder="輸入您的電子郵件" 
                    />
                </div>
                <button
                    className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 ease-in-out"
                >
                    儲存變更
                </button>
            </div>
          </ContentSection>
        );
      case 'data':
        return (
          <ContentSection title="資料管理" icon={LayoutGrid}>
            <p className="text-gray-600">
              在這個區域，我們可能會處理表格或複雜的數據網格。UX 的重點是提供高效的過濾、排序和批次操作，並且確保數據在行動裝置上仍然易於導航（例如：使用可水平滾動的表格）。
            </p>
            {/* 簡單數據列表 */}
            <ul className="mt-4 space-y-2">
                <li className="p-3 bg-gray-50 border rounded-lg flex justify-between items-center">
                    <span className="font-medium">數據項目 A</span>
                    <span className="text-sm text-indigo-600">狀態：活躍</span>
                </li>
                <li className="p-3 bg-gray-50 border rounded-lg flex justify-between items-center">
                    <span className="font-medium">數據項目 B</span>
                    <span className="text-sm text-red-600">狀態：待審核</span>
                </li>
            </ul>
          </ContentSection>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased">
      {/* 導入 Tailwind CSS JIT/CDN */}
      <script src="https://cdn.tailwindcss.com"></script>
      {/* 設定 Inter 字體 */}
      <style>{`
        body {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
      
      {/* 導航列 */}
      <NavBar
        isMenuOpen={isMenuOpen}
        toggleMenu={toggleMenu}
        navItems={navItems}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />

      {/* 主內容區域 */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
          {navItems.find(item => item.id === activeItem).name}
        </h1>
        
        {/* 內容區塊 */}
        {renderContent()}
      </main>

      {/* 頁腳 */}
      <footer className="bg-white border-t mt-12 p-4 text-center text-sm text-gray-500">
        &copy; 2024 UI/UX 範例應用程式. 專注於使用者體驗的優化。
      </footer>
    </div>
  );
};

export default App;
