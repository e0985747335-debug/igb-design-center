#!/bin/bash
set -e

echo "🛠 建立 e-Market 基礎結構..."

# === components ===
mkdir -p components

# Navbar
cat > components/Navbar.tsx << 'EON'
"use client";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-gray-900 text-white p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">🧠 e-Market</h1>
      <div className="space-x-4">
        <Link href="/" className="hover:text-gray-300">首頁</Link>
        <Link href="/market" className="hover:text-gray-300">進入市集</Link>
        <Link href="#" className="hover:text-gray-300">關於</Link>
      </div>
    </nav>
  );
}
EON

# Footer
cat > components/Footer.tsx << 'EOF2'
export default function Footer() {
  return (
    <footer className="bg-gray-100 text-center py-4 text-sm text-gray-500">
      © 2025 e-Market. All rights reserved.
    </footer>
  );
}
EOF2

# === app/layout.tsx ===
cat > app/layout.tsx << 'EOL'
import './globals.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export const metadata = {
  title: 'e-Market',
  description: '打造屬於本地的數位菜市場。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow p-6 bg-gray-50">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
EOL

# === app/page.tsx (首頁) ===
cat > app/page.tsx << 'EOP'
import Link from "next/link";

export default function Home() {
  return (
    <div className="text-center mt-16">
      <h1 className="text-4xl font-bold">歡迎來到 🧠 e-Market</h1>
      <p className="text-gray-600 mt-4">打造屬於本地的數位菜市場 — 讓消費者與生產者直接交易。</p>
      <Link href="/market" className="inline-block mt-6 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
        進入市集
      </Link>
    </div>
  );
}
EOP

# === app/market/page.tsx (市集頁) ===
mkdir -p app/market
cat > app/market/page.tsx << 'EOM'
export default function MarketPage() {
  const products = [
    { id: 1, name: "新鮮高麗菜", price: 35 },
    { id: 2, name: "放山雞蛋", price: 60 },
    { id: 3, name: "在地番茄", price: 45 },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-center">🥬 市集商品</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {products.map((item) => (
          <div key={item.id} className="border rounded-lg p-4 bg-white shadow hover:shadow-md transition">
            <h2 className="text-xl font-semibold">{item.name}</h2>
            <p className="text-gray-600 mt-2">NT$ {item.price}</p>
            <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              加入購物車
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
EOM

echo "✅ 已建立 Navbar、Footer、首頁與市集頁完成！"
