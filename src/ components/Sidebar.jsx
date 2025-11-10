import React from 'react';

export default function Sidebar({ onSelectModule }) {
  const menuItems = [
    { key: 'finance', label: '財務管理中心' },
    { key: 'hr', label: '人事管理中心' },
    { key: 'project', label: '專案管理中心' },
  ];

  return (
    <aside className="w-64 bg-white shadow-md h-screen p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-6">IGB Design Center</h2>
      <nav>
        <ul className="space-y-2">
          {menuItems.map(item => (
            <li key={item.key}>
              <button
                onClick={() => onSelectModule(item.key)}
                className="w-full text-left px-4 py-2 rounded hover:bg-gray-100 text-gray-700 font-medium"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
