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
