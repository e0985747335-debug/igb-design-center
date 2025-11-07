import React, { useState, useMemo, useEffect } from 'react';
import { RefreshCw, Activity, Zap, CheckCircle, AlertTriangle, Cpu, HardDrive, Database, Clock } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts';

// --- 模擬數據生成函數 ---

const generatePerformanceData = (points = 30) => {
  const data = [];
  const now = new Date();
  for (let i = 0; i < points; i++) {
    const time = new Date(now.getTime() - (points - 1 - i) * 60000); // 每分鐘一個點
    data.push({
      time: time.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
      latency: Math.floor(Math.random() * 80 + 20), // 20ms - 100ms
      throughput: Math.floor(Math.random() * 400 + 100), // 100 - 500 TPS
    });
  }
  return data;
};

const generateUtilizationData = () => ([
  { name: 'CPU 使用率', value: Math.floor(Math.random() * 30 + 55), fill: '#8884d8' },
  { name: '記憶體使用率', value: Math.floor(Math.random() * 20 + 70), fill: '#82ca9d' },
  { name: 'DB 連線池', value: Math.floor(Math.random() * 15 + 80), fill: '#ffc658' },
]);

const MOCK_ERROR_LOGS = [
  { id: 1, time: '2025/10/25 23:15:01', module: '財務結算', message: 'DB deadlock detected on ledger table.', severity: 'Critical' },
  { id: 2, time: '2025/10/25 23:14:30', module: '庫存管理', message: 'API gateway timeout when calling warehouse service.', severity: 'High' },
  { id: 3, time: '2025/10/25 23:14:05', module: '訂單處理', message: 'Uncaught exception in tax calculation component.', severity: 'Critical' },
  { id: 4, time: '2025/10/25 23:13:58', module: '使用者介面', message: 'High request latency for reporting service.', severity: 'Medium' },
];

const INITIAL_KPIS = {
  uptime: '99.98%',
  avgLatency: '45ms',
  tps: 320,
  criticalErrors: 4,
  dbPoolUsage: '85%',
};

// --- 組件：KPI 卡片 ---

const KpiCard = ({ icon: Icon, title, value, unit = '', color = 'text-green-400' }) => (
  <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 hover:border-indigo-500 transition duration-200">
    <div className="flex items-center space-x-3">
      <Icon className={`w-6 h-6 ${color}`} />
      <div>
        <div className="text-sm font-medium text-gray-400">{title}</div>
        <div className="text-2xl font-bold text-white mt-1">
          {value}
          <span className="text-base font-normal text-gray-400 ml-1">{unit}</span>
        </div>
      </div>
    </div>
  </div>
);

// --- 組件：效能折線圖 ---

const PerformanceChart = ({ data }) => (
  <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 h-80">
    <h3 className="text-lg font-semibold text-white mb-3">即時響應時間與吞吐量 (過去 30 分鐘)</h3>
    <ResponsiveContainer width="100%" height="85%">
      <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
        <XAxis dataKey="time" stroke="#9CA3AF" interval={4} />
        <YAxis yAxisId="left" stroke="#34D399" label={{ value: '延遲 (ms)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }} />
        <YAxis yAxisId="right" orientation="right" stroke="#6366F1" label={{ value: 'TPS (次/分)', angle: 90, position: 'insideRight', fill: '#9CA3AF' }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
          labelStyle={{ color: '#E5E7EB' }}
          formatter={(value, name, props) => [`${value} ${name === 'latency' ? 'ms' : '次/分'}`, name === 'latency' ? '延遲' : 'TPS']}
        />
        <Line yAxisId="left" type="monotone" dataKey="latency" name="延遲" stroke="#34D399" strokeWidth={2} dot={false} />
        <Line yAxisId="right" type="monotone" dataKey="throughput" name="TPS" stroke="#6366F1" strokeWidth={2} dot={false} />
        <Legend wrapperStyle={{ color: '#9CA3AF', paddingTop: '10px' }} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

// --- 組件：資源利用率徑向圖 ---

const ResourceUtilizationChart = ({ data }) => {
  const RADIAL_COLORS = ['#8884d8', '#82ca9d', '#ffc658'];
  
  // Custom label for the center display
  const renderCustomLabel = (props) => {
    const { cx, cy, payload } = props;
    if (payload.length === 0) return null;
    
    // Display the most critical metric (e.g., CPU) in the center
    const cpuMetric = payload.find(p => p.name === 'CPU 使用率');

    return (
      <g>
        <text x={cx} y={cy - 10} textAnchor="middle" dominantBaseline="central" fill="#E5E7EB" style={{ fontSize: '24px', fontWeight: 'bold' }}>
          {cpuMetric ? `${cpuMetric.value}%` : ''}
        </text>
        <text x={cx} y={cy + 15} textAnchor="middle" dominantBaseline="central" fill="#9CA3AF" style={{ fontSize: '14px' }}>
          CPU 使用率
        </text>
      </g>
    );
  };

  return (
    <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 h-80">
      <h3 className="text-lg font-semibold text-white mb-3">核心資源利用率</h3>
      <ResponsiveContainer width="100%" height="85%">
        <RadialBarChart
          cx="50%"
          cy="55%"
          innerRadius="20%"
          outerRadius="80%"
          barSize={20}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar
            minAngle={15}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            background
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={RADIAL_COLORS[index % RADIAL_COLORS.length]} />
            ))}
          </RadialBar>
          <Legend 
            iconSize={10} 
            layout="vertical" 
            verticalAlign="middle" 
            align="right" 
            wrapperStyle={{ color: '#9CA3AF', right: 0 }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#E5E7EB' }}
            formatter={(value, name) => [`${value}%`, name]}
          />
          {/* We are using a custom label/text over the chart instead of the chart label property */}
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- 組件：錯誤/異常日誌 ---

const ErrorLog = ({ logs }) => (
  <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700">
    <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center">
      <AlertTriangle className="w-5 h-5 mr-2" />
      近期關鍵異常日誌
    </h3>
    <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
      {logs.map(log => {
        let severityColor = 'text-red-500';
        if (log.severity === 'High') severityColor = 'text-yellow-500';
        if (log.severity === 'Medium') severityColor = 'text-orange-400';

        return (
          <div key={log.id} className="p-3 bg-gray-700 rounded-lg border-l-4 border-red-500">
            <div className="flex justify-between items-center text-xs">
              <span className={`font-bold ${severityColor}`}>{log.severity}</span>
              <span className="text-gray-400">{log.time}</span>
            </div>
            <div className="text-white text-sm mt-1 font-mono break-words">
              {log.message}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              模組: {log.module}
            </div>
          </div>
        );
      })}
    </div>
    {/* Custom scrollbar style for dark theme */}
    <style jsx="true">{`
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #374151; /* gray-700 */
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #4B5563; /* gray-600 */
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #6B7280; /* gray-500 */
      }
    `}</style>
  </div>
);

// --- 主要應用程式組件 ---

const App = () => {
  const [performanceData, setPerformanceData] = useState(generatePerformanceData());
  const [utilizationData, setUtilizationData] = useState(generateUtilizationData());
  const [kpis, setKpis] = useState(INITIAL_KPIS);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString('zh-TW'));
  const [isSystemOk, setIsSystemOk] = useState(true);

  // 模擬數據刷新功能
  const handleRefreshData = () => {
    setLoading(true);
    // 模擬 API 呼叫延遲
    setTimeout(() => {
      setPerformanceData(generatePerformanceData());
      setUtilizationData(generateUtilizationData());
      
      // 模擬 KPI 輕微波動
      setKpis({
        uptime: '99.' + (90 + Math.floor(Math.random() * 9)).toString(),
        avgLatency: (Math.floor(Math.random() * 20 + 30)).toString() + 'ms',
        tps: Math.floor(Math.random() * 100 + 300),
        criticalErrors: Math.floor(Math.random() * 5),
        dbPoolUsage: (Math.floor(Math.random() * 10 + 80)).toString() + '%',
      });

      // 模擬系統狀態變化
      setIsSystemOk(Math.random() > 0.1); 

      setLastUpdated(new Date().toLocaleTimeString('zh-TW'));
      setLoading(false);
    }, 1000);
  };

  // 每 30 秒自動刷新一次數據
  useEffect(() => {
    const interval = setInterval(handleRefreshData, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  // 系統狀態顯示
  const SystemStatusIndicator = () => (
    <div className="flex items-center space-x-2">
      {isSystemOk ? (
        <CheckCircle className="w-5 h-5 text-green-400 animate-pulse-slow" />
      ) : (
        <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse-fast" />
      )}
      <span className={`text-sm font-semibold ${isSystemOk ? 'text-green-400' : 'text-red-500'}`}>
        {isSystemOk ? '系統穩定運行' : '警告: 存在關鍵異常'}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 font-sans antialiased text-white p-4 sm:p-6">
      
      {/* Header and Controls */}
      <header className="mb-6 pb-4 border-b border-gray-700 flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-extrabold text-indigo-400">
          IGB ERP 2.0 策略指揮中心
          <span className="block text-sm font-light text-gray-400 mt-1">Technical Dashboard 技術儀表板</span>
        </h1>
        <div className="flex items-center space-x-4">
          <SystemStatusIndicator />
          <div className="text-sm text-gray-500 flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>更新時間: {lastUpdated}</span>
          </div>
          <button
            onClick={handleRefreshData}
            disabled={loading}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition duration-200 
              ${loading 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/50'
              }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? '載入中...' : '手動刷新'}</span>
          </button>
        </div>
      </header>

      {/* Section 1: Key Performance Indicators (KPIs) */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <KpiCard 
          icon={CheckCircle} 
          title="系統總體可用性" 
          value={kpis.uptime} 
          color="text-green-400"
        />
        <KpiCard 
          icon={Clock} 
          title="平均響應延遲" 
          value={kpis.avgLatency} 
          color="text-yellow-400"
        />
        <KpiCard 
          icon={Activity} 
          title="即時交易量" 
          value={kpis.tps.toLocaleString()} 
          unit="次/分"
          color="text-indigo-400"
        />
        <KpiCard 
          icon={Zap} 
          title="關鍵錯誤計數" 
          value={kpis.criticalErrors} 
          unit="個"
          color={kpis.criticalErrors > 0 ? 'text-red-500' : 'text-green-400'}
        />
        <KpiCard 
          icon={Database} 
          title="資料庫連線池" 
          value={kpis.dbPoolUsage} 
          color="text-orange-400"
        />
      </section>

      {/* Section 2: Charts and Visualizations */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Performance Chart - Span 2 columns on desktop */}
        <div className="lg:col-span-2">
          <PerformanceChart data={performanceData} />
        </div>
        
        {/* Resource Utilization Chart - Span 1 column */}
        <div className="lg:col-span-1">
          <ResourceUtilizationChart data={utilizationData} />
        </div>
      </section>

      {/* Section 3: Detailed Logs and Status */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Error Logs */}
        <div className="lg:col-span-1">
          <ErrorLog logs={MOCK_ERROR_LOGS} />
        </div>
        
        {/* System Status Table (Mock) */}
        <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 lg:col-span-1">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
            <Cpu className="w-5 h-5 mr-2 text-blue-400" />
            核心服務健康檢查
          </h3>
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="py-2 text-left text-gray-400">服務名稱</th>
                <th className="py-2 text-left text-gray-400">狀態</th>
                <th className="py-2 text-right text-gray-400">最後檢測</th>
              </tr>
            </thead>
            <tbody>
              <ServiceStatusRow name="訂單處理服務" status="正常" lastCheck="1秒前" isOk={true} />
              <ServiceStatusRow name="庫存管理服務" status="警告" lastCheck="5秒前" isOk={false} />
              <ServiceStatusRow name="財務介面服務" status="正常" lastCheck="2秒前" isOk={true} />
              <ServiceStatusRow name="報表資料庫" status="離線" lastCheck="10秒前" isOk={false} critical={true} />
            </tbody>
          </table>
        </div>
      </section>
      
    </div>
  );
};

// 服務狀態表格行組件
const ServiceStatusRow = ({ name, status, lastCheck, isOk, critical = false }) => (
  <tr className="border-b border-gray-800 hover:bg-gray-700 transition duration-150">
    <td className="py-3 text-white font-medium">{name}</td>
    <td className="py-3">
      <div className={`flex items-center font-bold ${isOk ? 'text-green-400' : critical ? 'text-red-500' : 'text-yellow-400'}`}>
        {isOk ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
        {status}
      </div>
    </td>
    <td className="py-3 text-right text-gray-400">{lastCheck}</td>
  </tr>
);

export default App;
