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
