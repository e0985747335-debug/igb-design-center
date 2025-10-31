'use client';

import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import React from 'react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function DashboardPage() {
  const data = {
    labels: ['一月', '二月', '三月', '四月', '五月'],
    datasets: [
      {
        label: '銷售額',
        data: [120, 190, 300, 500, 200],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: '每月銷售統計' },
    },
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">📊 Dashboard</h1>
      <div className="max-w-3xl">
        <Bar options={options} data={data} />
      </div>
    </div>
  );
}
