import React from "react";

const coreModules = [
{ title: "財務會計", desc: "總帳、帳收帳付、固定資產、報表分析與多幣別管理。" },
{ title: "進銷存 (ISP)", desc: "採購、銷售、庫存管理，進出庫作業與庫存即時追蹤。" },
{ title: "商品管理", desc: "物料主檔、BOM(物料清單)、多層架構及規格差異控制。" },
{ title: "廠商管理", desc: "供應商資料維護、評核、報價流程與採購合同管理。" },
{ title: "人事管理 (HR)", desc: "員工主檔、考勤記錄、薪資計算、績效評比與排班作業。" },
{ title: "ERP 管理", desc: "用戶權限、流程設定、系統參數設定與模組整合。" },
{ title: "ERP 雲端整合", desc: "API Gateway、跨系統整合服務、雲端備份與稽核。" },
{ title: "數據中心 / BI", desc: "即時數據儀表板、視覺分析、預測模型與資料倉儲。" },
];

export default function HomePage() {
return ( <div className="min-h-screen bg-gray-100">
{/* 頂部導覽列 */} <header className="bg-blue-700 text-white py-4 shadow"> <div className="max-w-7xl mx-auto flex justify-between items-center px-6"> <h1 className="text-2xl font-bold">IGB ERP 系統</h1> <nav className="space-x-4"> <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded">功能總覽</button> <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded">核心模組</button> <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded">系統架構圖</button> </nav> </div> </header>

```
  {/* 主體內容 */}
  <main className="max-w-6xl mx-auto p-6">
    <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-2">核心模組：全面的企業資源規劃</h2>
    <p className="text-gray-700 mb-6">
      IGB ERP 整合了八大關鍵功能領域，協助企業實現精細化管理與整體最佳化。
    </p>

    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {coreModules.map((m, i) => (
        <div
          key={i}
          className="bg-white rounded-xl shadow hover:shadow-md transition p-6 border-t-4 border-blue-500"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{m.title}</h3>
          <p className="text-gray-600 text-sm">{m.desc}</p>
        </div>
      ))}
    </div>
  </main>

  {/* 頁尾 */}
  <footer className="mt-12 text-center text-gray-500 text-sm pb-6">
    © {new Date().getFullYear()} IGB Design Center. All rights reserved.
  </footer>
</div>
```

);
}

