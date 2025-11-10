import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Palette, BarChart as BarChartIcon, LineChart as LineChartIcon, AreaChart as AreaChartIcon } from 'lucide-react';

// 模擬數據
const mockData = [
  { month: '一月', sales: 4000, profit: 2400, uv: 2400 },
  { month: '二月', sales: 3000, profit: 1398, uv: 2210 },
  { month: '三月', sales: 2000, profit: 9800, uv: 2290 },
  { month: '四月', sales: 2780, profit: 3908, uv: 2000 },
  { month: '五月', sales: 1890, profit: 4800, uv: 2181 },
  { month: '六月', sales: 2390, profit: 3800, uv: 2500 },
  { month: '七月', sales: 3490, profit: 4300, uv: 2100 },
];

// 主題配置
const themes = {
  blue: {
    name: '藍色主題',
    primaryColor: '#3b82f6', // blue-500
    secondaryColor: '#60a5fa', // blue-400
    bgColor: 'bg-blue-50',
    hoverClass: 'hover:bg-blue-100',
    focusClass: 'focus:ring-blue-500',
  },
  green: {
    name: '綠色主題',
    primaryColor: '#10b981', // emerald-500
    secondaryColor: '#34d399', // emerald-400
    bgColor: 'bg-green-50',
    hoverClass: 'hover:bg-green-100',
    focusClass: 'focus:ring-green-500',
  },
  purple: {
    name: '紫色主題',
    primaryColor: '#8b5cf6', // violet-500
    secondaryColor: '#a78bfa', // violet-400
    bgColor: 'bg-purple-50',
    hoverClass: 'hover:bg-purple-100',
    focusClass: 'focus:ring-purple-500',
  },
};

// 圖表類型配置
const chartTypes = [
  { id: 'BarChart', label: '長條圖', icon: BarChartIcon },
  { id: 'LineChart', label: '折線圖', icon: LineChartIcon },
  { id: 'AreaChart', label: '面積圖', icon: AreaChartIcon },
];

// 自訂卡片組件
const Card = ({ children, className = '' }) => (
  <div className={`bg-white p-6 rounded-xl shadow-lg ${className}`}>
    {children}
  </div>
);

// 自訂按鈕組件
const Button = ({ children, onClick, active, color, className = '' }) => (
  <button
    onClick={onClick}
    className={`
      px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
      ${active
        ? `bg-${color}-600 text-white shadow-md`
        : `bg-gray-100 text-gray-700 hover:bg-gray-200`
      }
      ${className}
    `}
  >
    {children}
  </button>
);


function App() {
  const [currentChartType, setCurrentChartType] = useState('BarChart');
  const [currentTheme, setCurrentTheme] = useState('blue');

  const themeConfig = useMemo(() => themes[currentTheme], [currentTheme]);
  const primaryColor = themeConfig.primaryColor;
  const secondaryColor = themeConfig.secondaryColor;

  // 動態渲染圖表
  const renderChart = () => {
    const commonProps = {
      data: mockData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    const commonChartElements = (
      <>
        <XAxis dataKey="month" stroke={primaryColor} />
        <YAxis stroke={primaryColor} />
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <Tooltip
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          labelStyle={{ fontWeight: 'bold', color: primaryColor }}
        />
        <Legend />
      </>
    );

    switch (currentChartType) {
      case 'BarChart':
        return (
          <BarChart {...commonProps}>
            {commonChartElements}
            <Bar dataKey="sales" fill={primaryColor} name="銷售額" radius={[4, 4, 0, 0]} />
            <Bar dataKey="profit" fill={secondaryColor} name="利潤" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'LineChart':
        return (
          <LineChart {...commonProps}>
            {commonChartElements}
            <Line type="monotone" dataKey="sales" stroke={primaryColor} strokeWidth={3} dot={{ stroke: primaryColor, strokeWidth: 2, r: 4 }} activeDot={{ r: 8 }} name="銷售額" />
            <Line type="monotone" dataKey="profit" stroke={secondaryColor} strokeWidth={3} dot={{ stroke: secondaryColor, strokeWidth: 2, r: 4 }} activeDot={{ r: 8 }} name="利潤" />
          </LineChart>
        );
      case 'AreaChart':
        return (
          <AreaChart {...commonProps}>
            {commonChartElements}
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={primaryColor} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={secondaryColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="sales" stroke={primaryColor} fillOpacity={1} fill="url(#colorSales)" name="銷售額" />
            <Area type="monotone" dataKey="profit" stroke={secondaryColor} fillOpacity={1} fill="url(#colorProfit)" name="利潤" />
          </AreaChart>
        );
      default:
        return null;
    }
  };

  return (
    // 使用 themeConfig.bgColor 應用整體背景色
    <div className={`min-h-screen ${themeConfig.bgColor} p-4 sm:p-8 font-sans`}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-8 text-gray-800 flex items-center">
          <BarChartIcon className="w-8 h-8 mr-3" color={primaryColor} />
          動態數據儀表板
        </h1>

        {/* 控制面板 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
              <LineChartIcon className="w-5 h-5 mr-2" />
              圖表類型
            </h2>
            <div className="flex flex-wrap gap-3">
              {chartTypes.map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  onClick={() => setCurrentChartType(id)}
                  active={currentChartType === id}
                  color={currentTheme} // 使用當前主題顏色
                  className={`flex items-center ${currentChartType === id ? `bg-[${primaryColor}] text-white` : ''}`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {label}
                </Button>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
              <Palette className="w-5 h-5 mr-2" />
              顏色主題
            </h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(themes).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setCurrentTheme(key)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                    flex items-center justify-center space-x-2
                    ${key === currentTheme
                      ? `ring-4 ring-offset-2 ring-opacity-75 ring-${key}-500 transform scale-105`
                      : 'opacity-70 hover:opacity-100'
                    }
                    bg-white border-2 border-gray-200
                  `}
                  title={config.name}
                >
                  <div className={`w-4 h-4 rounded-full shadow-md`} style={{ backgroundColor: config.primaryColor }}></div>
                  <span className={`${key === currentTheme ? 'font-bold text-gray-800' : 'text-gray-600'}`}>{config.name.replace('主題', '')}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* 圖表展示區 */}
        <Card className="h-[50vh] min-h-[400px]">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            數據分析: 月度 {chartTypes.find(t => t.id === currentChartType).label}
          </h2>
          <ResponsiveContainer width="100%" height="90%">
            {renderChart()}
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

export default App;
