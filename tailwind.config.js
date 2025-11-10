/** @type {import('tailwindcss').Config} */
// 這是 Tailwind CSS 的配置文件
export default {
  // 1. CONTENT：Tailwind 掃描路徑
  // 設置要掃描的檔案路徑。Tailwind 會在這些檔案中尋找它需要編譯的 CSS 類別。
  // 這樣做是為了生成最終的、最小化的 CSS 檔案 (稱為 Tree-shaking 或 Purging)。
  content: [
    "./index.html", // 掃描根目錄下的 HTML 檔案
    "./src/**/*.{js,ts,jsx,tsx}", // **關鍵：掃描所有 React 組件 (.jsx, .tsx 等)**
  ],
  
  // 2. THEME：自定義設計系統
  theme: {
    // 'extend' 用於在保持 Tailwind 默認主題的基礎上，額外添加您的客製化內容。
    extend: {
      // 自定義字體
      fontFamily: {
        // 將 'sans' (無襯線字體) 設置為 'Inter'，確保設計一致性。
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      // 自定義顏色
      colors: {
        // 這是您專案的專屬藍色 (靛藍)。
        // 使用方式：className="bg-erp-indigo" 或 className="text-erp-indigo"
        'erp-indigo': '#4F46E5', 
        // 這是應用程式的預設背景色，通常是淺灰色。
        // 使用方式：className="bg-erp-bg"
        'erp-bg': '#F0F0F0',
      }
    },
  },
  
  // 3. PLUGINS：如果您使用任何 Tailwind 插件，請在這裡加入
  plugins: [],
}
