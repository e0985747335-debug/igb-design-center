import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, collection, query, updateDoc, setDoc, addDoc } from 'firebase/firestore'; // 引入 addDoc

// --- 全域變數檢查和初始化 (Global Variables Check and Initialization) ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-erp-app-id';

let db = null;
let auth = null;
if (firebaseConfig) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
}
// 設置日誌級別以便偵錯
if (db) {
  console.log("Firebase initialized.");
  // setLogLevel('debug'); // 如果需要詳細的 Firestor Log，可以取消註解
}

// --- 靜態假資料 (在 Firebase 數據載入前或出錯時使用) ---
const initialKpiData = [
  {
    id: 'coverage', title: "結帳單涵蓋率",
    value: "85%", subtitle: "+5% MTD",
    color: "text-blue-600", bgColor: "bg-blue-50",
  },
  {
    id: 'mdm_clean', title: "MDM 數據清洗率",
    value: "85%", subtitle: "目標: 95%",
    color: "text-blue-600", bgColor: "bg-blue-50",
  },
  {
    id: 'api_comp', title: "核心微服務 API 完成度",
    value: "7/10", subtitle: "待開發 3 個",
    color: "text-green-600", bgColor: "bg-green-50",
  },
  {
    id: 'risk_level', title: "關鍵風險等級",
    value: "低 (1)", subtitle: "待解除 2 個",
    color: "text-red-600", bgColor: "bg-red-50",
  },
];

const initialChartData = [
  { time: '08:00', revenue: 150000, cost: 100000 },
  { time: '09:00', revenue: 180000, cost: 120000 },
  { time: '10:00', revenue: 230000, cost: 150000 },
  { time: '11:00', revenue: 250000, cost: 170000 },
  { time: '12:00', revenue: 280000, cost: 190000 },
  { time: '13:00', revenue: 300000, cost: 210000 },
  { time: '14:00', revenue: 320000, cost: 230000 },
  { time: '15:00', revenue: 310000, cost: 220000 },
  { time: '16:00', revenue: 290000, cost: 200000 },
  { time: '17:00', revenue: 270000, cost: 180000 },
  { time: '18:00', revenue: 285000, cost: 195000 },
  { time: '19:00', revenue: 275000, cost: 185000 },
  { time: '20:00', revenue: 250000, cost: 175000 },
];

const initialProjectData = [
  { id: 'p1', name: "MDM 數據清洗專案", status: "進行中", progress: 75, risk: "中" },
  { id: 'p2', name: "微服務架構遷移 (APIs)", status: "待驗收", progress: 90, risk: "低" },
  { id: 'p3', name: "新倉儲管理系統 (WMS) 導入", status: "已延期", progress: 40, risk: "高" },
  { id: 'p4', name: "財務報表自動化", status: "已完成", progress: 100, risk: "低" },
  { id: 'p5', name: "雲端資源優化排程", status: "進行中", progress: 60, risk: "中" },
];

// --- 元件定義 (Component Definitions) ---

const Sidebar = ({ currentView, setView }) => {
  const NavItem = ({ view, icon, label }) => (
    <button
      onClick={() => setView(view)}
      className={`flex items-center space-x-3 p-3 text-sm font-medium transition duration-150 ease-in-out rounded-lg w-full text-left
        ${currentView === view
          ? 'bg-blue-600 text-white shadow-lg'
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="w-64 bg-white dark:bg-gray-800 p-4 border-r border-gray-200 dark:border-gray-700 h-full">
      <div className="text-xl font-bold text-gray-800 dark:text-white mb-8">
        IGB ERP 2.0
        <div className="text-xs font-normal text-gray-500">戰略指揮中心</div>
      </div>
      <nav className="space-y-2">
        <NavItem
          view="EHSN"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l8 4.5v9L12 22l-8-4.5v-9L12 2z"/><polyline points="12 2 12 12 20 7.5"/></svg>}
          label="核心指標 (EHSN)"
        />
        <NavItem
          view="MDM"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
          label="執行指標 (MDM)"
        />
        <NavItem
          view="MONITOR"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>}
          label="監測預警 (排程/財報)"
        />
        <NavItem
          view="RISK"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.86 18.04C1.35 18.9 1.76 20 2.8 20h18.4c1.04 0 1.45-1.1 0.94-1.96L13.71 3.86c-.49-.85-1.74-.85-2.23 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12" y2="17"/></svg>}
          label="風險追蹤"
        />
        <NavItem
          view="LOG"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 4H5c-1.11 0-2 .89-2 2v12a2 2 0 002 2h14c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2z"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="7" y1="2" x2="7" y2="6"/><line x1="17" y1="2" x2="17" y2="6"/></svg>}
          label="決策日誌"
        />
        <NavItem
          view="FILE"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>}
          label="文件管理"
        />
      </nav>
      {/* 顯示使用者 ID 以便協作 */}
      <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">當前用戶 ID:</p>
        <p className="text-xs break-all text-gray-700 dark:text-gray-300">
          {auth?.currentUser ? auth.currentUser.uid : '認證中...'}
        </p>
      </div>
    </div>
  );
};

const KPICard = ({ kpi, color, bgColor, onEdit }) => (
  <div className={`p-6 rounded-xl shadow-lg transition duration-300 ease-in-out hover:shadow-xl border border-gray-100 dark:border-gray-700 ${bgColor} dark:bg-gray-700 relative`}>
    <button
      onClick={() => onEdit('kpi', kpi)}
      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-blue-500 transition rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
      title="編輯 KPI"
    >
      {/* 設定 Icon (Settings) */}
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 2 2 0 00-1 3.5v.06a2 2 0 01-2.83 0 2 2 0 010-2.83v-.06a2 2 0 00-1-3.5 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 2 2 0 00-3.5-1v-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33 2 2 0 003.5-1v-.06a2 2 0 012.83 0 2 2 0 010 2.83v.06a2 2 0 001 3.5 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82z"/></svg>
    </button>
    <h3 className="text-md font-semibold text-gray-500 dark:text-gray-300 mb-2">{kpi.title}</h3>
    <p className={`text-4xl font-bold ${kpi.color} dark:text-white`}>{kpi.value}</p>
    <p className="text-sm text-gray-400 mt-2">{kpi.subtitle}</p>
  </div>
);

// 更新 ProjectList 元件，新增 onAdd 屬性
const ProjectList = ({ data, onEdit, onAdd }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case '進行中': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300';
      case '待驗收': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case '已延期': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      case '已完成': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 h-full flex flex-col">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center justify-between">
        <span className='flex items-center'>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-blue-500"><path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          戰略專案清單 (Project Status)
        </span>
        {/* 新增專案按鈕 */}
        <button
            onClick={onAdd}
            className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg font-medium transition shadow-md flex items-center space-x-1"
            title="新增專案"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span className="hidden sm:inline">新增</span>
        </button>
      </h2>
      <div className="space-y-4 flex-grow overflow-y-auto min-h-0">
        {data.length === 0 ? (
          <p className="text-gray-400 italic">無專案數據。</p>
        ) : (
          data.map((project) => (
            <div key={project.id} className="p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md transition">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{project.name}</p>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                  <button
                    onClick={() => onEdit('project', project)}
                    className="p-1 text-gray-400 hover:text-blue-500 transition rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
                    title="編輯專案"
                  >
                    {/* 編輯 Icon (Pencil) */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 114 4L7.5 20.5L2 22l1.5-5.5L17 3z"/></svg>
                  </button>
                </div>
              </div>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <span className="w-1/3">進度: {project.progress}%</span>
                <div className="w-2/3 ml-2 h-1 bg-gray-200 rounded-full dark:bg-gray-600">
                  <div
                    className="h-1 rounded-full"
                    style={{
                      width: `${project.progress}%`,
                      backgroundColor: project.progress === 100 ? '#10b981' : (project.progress > 50 ? '#3b82f6' : '#f59e0b')
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-4 text-center border-t pt-4 border-gray-100 dark:border-gray-700">
        <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 transition font-medium">
          查看所有專案詳情 &rarr;
        </button>
      </div>
    </div>
  );
};
// --- ProjectList 元件結束 ---

// 更新 EditModal 元件，接受 mode 屬性
const EditModal = ({ itemType, initialData, mode, onSave, onClose }) => {
  const [formData, setFormData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);

  const isKPI = itemType === 'kpi';
  const isAdding = mode === 'add';

  // 確保在新增模式下有預設值
  useEffect(() => {
    if (isAdding && itemType === 'project') {
      setFormData({
        name: '',
        status: '進行中',
        progress: 0,
        risk: '低',
        id: null
      });
    }
  }, [isAdding, itemType]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // 傳遞 mode 給上層的 onSave 函數
    await onSave(itemType, formData, mode);
    setIsSaving(false);
    onClose();
  };


  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 dark:bg-opacity-90 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 border-b pb-3 border-gray-200 dark:border-gray-700">
          {isAdding ? '新增' : '編輯'} {isKPI ? '核心指標 (KPI)' : '戰略專案'}
        </h3>

        <form className="space-y-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">名稱/標題</label>
            <input
              type="text"
              name={isKPI ? 'title' : 'name'}
              value={formData[isKPI ? 'title' : 'name'] || ''}
              onChange={handleChange}
              className="p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              // KPI 的標題通常固定，新增專案的名稱則需要輸入
              disabled={isKPI && mode === 'edit'}
            />
          </div>

          {isKPI ? (
            <>
              {/* KPI 專屬欄位 (編輯模式) */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">指標值 (Value)</label>
                <input
                  type="text"
                  name="value"
                  value={formData.value || ''}
                  onChange={handleChange}
                  className="p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">副標題 (Subtitle)</label>
                <input
                  type="text"
                  name="subtitle"
                  value={formData.subtitle || ''}
                  onChange={handleChange}
                  className="p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </>
          ) : (
            <>
              {/* 專案專屬欄位 (編輯/新增模式) */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">進度 (%)</label>
                <input
                  type="number"
                  name="progress"
                  value={formData.progress || 0}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className="p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex space-x-4">
                <div className="flex flex-col w-1/2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">狀態</label>
                    <select
                      name="status"
                      value={formData.status || '進行中'}
                      onChange={handleChange}
                      className="p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    >
                      {['進行中', '待驗收', '已完成', '已延期'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                </div>
                <div className="flex flex-col w-1/2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">風險等級</label>
                    <select
                      name="risk"
                      value={formData.risk || '低'}
                      onChange={handleChange}
                      className="p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    >
                      {['低', '中', '高'].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                </div>
              </div>
            </>
          )}
        </form>

        <div className="flex justify-end space-x-4 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            disabled={isSaving}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className={`px-6 py-2 text-white rounded-lg font-semibold transition ${isSaving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            disabled={isSaving}
          >
            {isSaving ? '儲存中...' : (isAdding ? '建立專案' : '儲存變更')}
          </button>
        </div>
      </div>
    </div>
  );
};
// --- 編輯 Modal 元件結束 ---


// 從 Firestore 獲取數據的 Hook
const useDashboardData = (isAuthReady) => {
  const [kpiData, setKpiData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [projectData, setProjectData] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!db || !isAuthReady) {
      if (!isAuthReady) {
         console.warn("Auth not ready, using static data.");
      }
      setKpiData(initialKpiData);
      setChartData(initialChartData);
      setProjectData(initialProjectData);
      setIsLoadingData(false);
      return;
    }

    // 1. 獲取 KPI 數據
    const kpisRef = collection(db, `/artifacts/${appId}/public/data/kpis`);
    const kpisQuery = query(kpisRef);
    const unsubscribeKpis = onSnapshot(kpisQuery, (snapshot) => {
      const kpis = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const orderedKpis = initialKpiData.map((initialKpi) => {
        const liveKpi = kpis.find(k => k.id === initialKpi.id);
        return {
          ...initialKpi,
          value: liveKpi?.value ?? initialKpi.value,
          subtitle: liveKpi?.subtitle ?? initialKpi.subtitle,
        };
      });
      setKpiData(orderedKpis);
    }, (error) => {
      console.error("Error fetching KPI data:", error);
      setKpiData(initialKpiData);
    });

    // 2. 獲取圖表數據
    const trendDocRef = doc(db, `/artifacts/${appId}/public/data/trends/daily`);
    const unsubscribeTrends = onSnapshot(trendDocRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().data) {
        try {
          const data = JSON.parse(docSnap.data().data);
          setChartData(data);
        } catch (e) {
          console.error("Error parsing trend data:", e);
          setChartData(initialChartData);
        }
      } else {
        setChartData(initialChartData);
      }
    }, (error) => {
      console.error("Error fetching trend data:", error);
      setChartData(initialChartData);
    });

    // 3. 獲取專案數據
    const projectsRef = collection(db, `/artifacts/${appId}/public/data/projects`);
    const projectsQuery = query(projectsRef);
    const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjectData(projects.length > 0 ? projects : initialProjectData);
      setIsLoadingData(false);
    }, (error) => {
      console.error("Error fetching project data:", error);
      setProjectData(initialProjectData);
      setIsLoadingData(false);
    });

    return () => {
      unsubscribeKpis();
      unsubscribeTrends();
      unsubscribeProjects();
    };
  }, [isAuthReady]);

  return { kpiData, chartData, projectData, isLoadingData };
};


const TrendChart = ({ data }) => {
  // eslint-disable-next-line no-unused-vars
  const formatter = (value) => `${(value / 1000).toFixed(0)}K`;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 mt-8">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">即時銷貨收入與成本趨勢</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        此趨勢圖展示了當日實時累積的銷貨收入與銷售成本，為管理層提供即時營運狀況的參考依據。
      </p>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700"/>
            <XAxis dataKey="time" stroke="#6b7280" className="text-xs"/>
            <YAxis tickFormatter={formatter} stroke="#6b7280" className="text-xs"/>
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: 'white' }}
              labelStyle={{ color: '#9ca3af' }}
              formatter={(value) => [`$${value.toLocaleString()}`, '金額']}
            />
            <Area type="monotone" dataKey="revenue" name="銷貨收入" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2}/>
            <Area type="monotone" dataKey="cost" name="銷貨成本" stroke="#10b981" fillOpacity={1} fill="url(#colorCost)" strokeWidth={2}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// 接受 onAddProject 屬性
const EHSNDashboard = ({ kpiData, chartData, projectData, isLoadingData, onEdit, onAddProject }) => (
  <div className="p-6 md:p-10">
    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2">核心指標：EHSN 願景實時狀態</h1>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
      本部分展示 ERP 2.0 系統上線後，四項宏觀 (High-Efficiency)、協同驅動運行 (AI/Ops) 的預期關鍵效益 (KPIs)，反映「MDM 數據清洗率、卡片行為表現」的即時分數。
    </p>

    {isLoadingData && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="animate-spin h-5 w-5 mr-3 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            數據載入中... (若載入失敗將顯示靜態數據)
        </div>
    )}

    {/* 主要內容網格: 2/3 寬度給 KPI 和 1/3 寬度給專案清單 */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* 左側欄 (2/3 寬度): 核心 KPI */}
      <div className="lg:col-span-2 space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">核心 KPI 實時分數</h2>
        {/* KPI Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiData.map((kpi, index) => (
            <KPICard key={index} kpi={kpi} color={kpi.color} bgColor={kpi.bgColor} onEdit={onEdit} />
          ))}
        </div>
      </div>

      {/* 右側欄 (1/3 寬度): 專案清單 */}
      <div className="lg:col-span-1 h-[27rem] lg:h-auto">
        {/* 傳遞 onAdd 屬性 */}
        <ProjectList data={projectData} onEdit={onEdit} onAdd={onAddProject} />
      </div>

    </div>

    {/* 趨勢圖 (全寬) */}
    <TrendChart data={chartData} />
  </div>
);

// --- MDM 儀表板組件 (未修改) ---
const MDMKPICard = ({ kpi }) => (
  <div className={`p-5 rounded-xl shadow-md transition duration-300 border border-gray-200 dark:border-gray-700 ${kpi.bgColor} dark:bg-gray-700`}>
    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-300 mb-2 truncate">{kpi.title}</h3>
    <p className={`text-3xl font-bold ${kpi.color} dark:text-white`}>{kpi.value}</p>
    <div className="flex justify-between items-center text-xs mt-2 text-gray-500 dark:text-gray-400">
      <span>目標: {kpi.target}</span>
      <span className="font-medium text-green-500">{kpi.trend}</span>
    </div>
  </div>
);

const MDMDashboard = () => {
  // Static data for MDM (simulating a fetch for execution metrics)
  const mdmKpiData = [
    { id: 'quality', title: "數據品質分數 (DQ Score)", value: "89.5%", target: "95%", trend: "+2.1% MoM", color: "text-indigo-600", bgColor: "bg-indigo-50" },
    { id: 'stewardship', title: "數據管理速度 (Avg. Resolution Time)", value: "4.2 小時", target: "3.0 小時", trend: "-15% MoM", color: "text-yellow-600", bgColor: "bg-yellow-50" },
    { id: 'coverage', title: "關鍵屬性涵蓋率 (Customer)", value: "98.1%", target: "99%", trend: "+0.5% MoM", color: "text-teal-600", bgColor: "bg-teal-50" },
    { id: 'match_rate', title: "實體匹配成功率 (Product)", value: "93.0%", target: "95%", trend: "0.0% MoM", color: "text-pink-600", bgColor: "bg-pink-50" },
  ];

  const mdmTrendData = [
    { month: '一月', score: 82, errors: 1200 },
    { month: '二月', score: 84, errors: 1050 },
    { month: '三月', score: 85, errors: 980 },
    { month: '四月', score: 87, errors: 850 },
    { month: '五月', score: 88, errors: 790 },
    { month: '六月', score: 89.5, errors: 720 },
  ];

  const mdmExceptions = [
    { id: 1, type: "客戶", description: "地址欄位非空檢查失敗", severity: "高", count: 45, owner: "客戶數據組" },
    { id: 2, type: "產品", description: "SKU 與主類目不匹配", severity: "中", count: 78, owner: "產品數據組" },
    { id: 3, type: "供應商", description: "統一編號重複 (Potential Duplicate)", severity: "高", count: 12, owner: "供應鏈數據組" },
    { id: 4, type: "資產", description: "資產標籤格式錯誤", severity: "低", count: 110, owner: "資產管理組" },
    { id: 5, type: "員工", description: "職位描述缺失", severity: "低", count: 65, owner: "HR 數據組" },
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case '高': return 'text-red-700 bg-red-100 dark:bg-red-900/50';
      case '中': return 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/50';
      case '低': return 'text-green-700 bg-green-100 dark:bg-green-900/50';
      default: return 'text-gray-700 bg-gray-100 dark:bg-gray-700';
    }
  };

  const scoreFormatter = (value) => `${value}%`;

  return (
    <div className="p-6 md:p-10">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2">執行指標 (MDM): 主數據管理儀表板</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        實時追蹤 MDM 數據的品質、完整性和管理效率，確保 ERP 2.0 系統的數據基礎穩固。
      </p>

      {/* 1. MDM 核心 KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {mdmKpiData.map((kpi) => (
          <MDMKPICard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. DQ Score 趨勢圖 (2/3 寬度) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">月度數據品質分數趨勢</h2>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mdmTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDQScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/> {/* Indigo-500 */}
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700"/>
                <XAxis dataKey="month" stroke="#6b7280" className="text-xs"/>
                <YAxis domain={[80, 100]} tickFormatter={scoreFormatter} stroke="#6b7280" className="text-xs"/>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: 'white' }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(value, name) => {
                    if (name === 'score') return [`${value}%`, 'DQ Score'];
                    if (name === 'errors') return [value.toLocaleString(), '未處理錯誤數'];
                    return value;
                  }}
                />
                <Area type="monotone" dataKey="score" name="DQ Score" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorDQScore)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. 數據異常處理清單 (1/3 寬度) */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 h-full flex flex-col">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">數據異常 (待處理例外)</h2>
          <div className="space-y-3 flex-grow overflow-y-auto min-h-0">
            {mdmExceptions.map((item) => (
              <div key={item.id} className="p-3 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-medium text-gray-800 dark:text-white">{item.type}: {item.description}</span>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getSeverityColor(item.severity)}`}>
                    {item.severity}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>數量: {item.count}</span>
                  <span className="font-medium">負責人: {item.owner}</span>
                </div>
              </div>
            ))}
            {mdmExceptions.length === 0 && <p className="text-gray-400 italic">無待處理數據異常。</p>}
          </div>
          <div className="mt-4 text-center border-t pt-4 border-gray-100 dark:border-gray-700">
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 transition font-medium">
              查看所有數據例外 &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
// --- MDM 儀表板組件 (結束) ---


// 更新 DashboardContent 傳遞 onAddProject
const DashboardContent = ({ currentView, kpiData, chartData, projectData, isLoadingData, onEdit, onAddProject }) => {
  switch (currentView) {
    case 'EHSN':
      return <EHSNDashboard kpiData={kpiData} chartData={chartData} projectData={projectData} isLoadingData={isLoadingData} onEdit={onEdit} onAddProject={onAddProject} />;
    case 'MDM':
      return <MDMDashboard />;
    case 'MONITOR':
      return <div className="p-10 text-gray-500 dark:text-gray-400">監測預警頁面內容即將開發...</div>;
    case 'RISK':
      return <div className="p-10 text-gray-500 dark:text-gray-400">風險追蹤頁面內容即將開發...</div>;
    case 'LOG':
      return <div className="p-10 text-gray-500 dark:text-gray-400">決策日誌頁面內容即將開發...</div>;
    case 'FILE':
      return <div className="p-10 text-gray-500 dark:text-gray-400">文件管理頁面內容即將開發...</div>;
    default:
      return <EHSNDashboard kpiData={kpiData} chartData={chartData} projectData={projectData} isLoadingData={isLoadingData} onEdit={onEdit} onAddProject={onAddProject} />;
  }
};

// Main App Component
export default function App() {
  const [currentView, setCurrentView] = useState('EHSN');
  const [isAuthReady, setIsAuthReady] = useState(false);
  // 使用新的 modalConfig 狀態來處理編輯和新增
  const [modalConfig, setModalConfig] = useState(null); // { type: 'project'|'kpi', data: {...}, mode: 'add'|'edit' }

  // 解構 projectData
  const { kpiData, chartData, projectData, isLoadingData } = useDashboardData(isAuthReady);
  // eslint-disable-next-line no-unused-vars
  const [isFirebaseInitialized, setIsFirebaseInitialized] = useState(!!auth);

  // 處理 Firebase 認證和狀態
  useEffect(() => {
    if (!auth) {
        console.error("Firebase Auth object is not available. Check __firebase_config.");
        setIsAuthReady(true);
        return;
    }

    const authenticate = async () => {
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
          console.log("Signed in with custom token.");
        } else {
          await signInAnonymously(auth);
          console.log("Signed in anonymously.");
        }
      } catch (error) {
        console.error("Authentication error:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Auth state changed. User ID:", user.uid);
        setIsAuthReady(true);
      } else if (!isAuthReady) {
        authenticate();
      }
    });

    return () => unsubscribe();
  }, []);

  // 編輯處理函數 (設定為 'edit' 模式)
  const handleEdit = (type, data) => {
    setModalConfig({ type, data, mode: 'edit' });
  };

  // 新增專案處理函數 (設定為 'add' 模式)
  const handleAddProjectClick = () => {
      setModalConfig({
          type: 'project',
          data: { name: '', status: '進行中', progress: 0, risk: '低' },
          mode: 'add'
      });
  };

  // 儲存處理函數，現在接受 mode 參數
  const handleSave = async (type, updatedData, mode) => {
    if (!db || !isAuthReady) {
      console.error("Firestore not ready. Cannot save data.");
      return;
    }

    try {
      if (type === 'kpi') {
        // KPI 只能編輯不能新增 (在當前 UI 邏輯下)
        if (mode === 'edit') {
            const kpiDocRef = doc(db, `/artifacts/${appId}/public/data/kpis/${updatedData.id}`);
            await updateDoc(kpiDocRef, {
                value: updatedData.value,
                subtitle: updatedData.subtitle
            });
            console.log(`KPI ${updatedData.id} updated successfully.`);
        }

      } else if (type === 'project') {
        const projectCollectionRef = collection(db, `/artifacts/${appId}/public/data/projects`);

        if (mode === 'add') {
            // 新增專案：使用 addDoc
            await addDoc(projectCollectionRef, {
                name: updatedData.name,
                status: updatedData.status,
                progress: parseInt(updatedData.progress, 10),
                risk: updatedData.risk || '低',
            });
            console.log("New project added successfully.");

        } else if (mode === 'edit' && updatedData.id) {
            // 編輯現有專案：使用 updateDoc
            const projectDocRef = doc(projectCollectionRef, updatedData.id);
            await updateDoc(projectDocRef, {
                name: updatedData.name,
                status: updatedData.status,
                progress: parseInt(updatedData.progress, 10),
                risk: updatedData.risk,
            });
            console.log(`Project ${updatedData.id} updated successfully.`);
        }
      }
    } catch (error) {
      console.error(`Error saving ${type} data:`, error);
      // 處理 KPI 不存在時自動創建的邏輯
      if (type === 'kpi' && error.code === 'not-found') {
        try {
            const kpiDocRef = doc(db, `/artifacts/${appId}/public/data/kpis/${updatedData.id}`);
            await setDoc(kpiDocRef, { value: updatedData.value, subtitle: updatedData.subtitle });
            console.log(`KPI ${updatedData.id} created and updated successfully.`);
        } catch (setError) {
             console.error(`Final error setting ${type} data:`, setError);
        }
      }
    }
  };

  // 認證中的載入畫面
  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-100 dark:bg-gray-900">
        <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="ml-3 text-lg font-medium text-gray-700 dark:text-gray-300">認證中，請稍候...</span>
      </div>
    );
  }


  return (
    <div className="flex h-screen w-full font-sans bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar currentView={currentView} setView={setCurrentView} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <DashboardContent
          currentView={currentView}
          kpiData={kpiData}
          chartData={chartData}
          projectData={projectData}
          isLoadingData={isLoadingData}
          onEdit={handleEdit}
          onAddProject={handleAddProjectClick} // 傳遞新增函數
        />
      </main>

      {/* 編輯/新增 Modal */}
      {modalConfig && (
        <EditModal
          itemType={modalConfig.type}
          initialData={modalConfig.data}
          mode={modalConfig.mode}
          onSave={handleSave}
          onClose={() => setModalConfig(null)}
        />
      )}
    </div>
  );
}
