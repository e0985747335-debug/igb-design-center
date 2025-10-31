"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export default function DashboardPage() {
  // ✅ 明確指定 Ref 型別為 HTMLCanvasElement
  const chartRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // ✅ 安全取出 2D 繪圖上下文
    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // ✅ 建立 Chart 實例
    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May"],
        datasets: [
          {
            label: "Monthly Sales",
            data: [120, 190, 300, 500, 250],
            backgroundColor: "rgba(75, 192, 192, 0.6)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
        },
        scales: {
          y: { beginAtZero: true },
        },
      },
    });

    // ✅ 清理 Chart 避免重複建立
    return () => chart.destroy();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      <canvas ref={chartRef} width={400} height={200}></canvas>
    </div>
  );
}
