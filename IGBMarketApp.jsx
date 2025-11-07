import React, { useState } from 'react';

// --- 模擬 Lucide-React 圖標 ---
const Home = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>);
const ShoppingCart = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 12.42a2 2 0 0 0 2 1.58h9.72a2 2 0 0 0 2-1.58L23 6H6"/></svg>);
const Users = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const Camera = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>);
const Star = ({ fill = 'none', className = 'w-5 h-5', ...rest }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...rest}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
);


// --- 模擬數據 ---
const mockReviews = [
  { id: 1, user: '王小美', rating: 5, comment: '甜柿非常新鮮，果肉清脆多汁！會再回購。', date: '2025-09-20', image: 'https://placehold.co/150x150/50b284/ffffff?text=客戶實拍 (5★)', product: '當季新鮮甜柿 (一盒)' },
  { id: 2, user: '陳大衛', rating: 3, comment: '菠菜葉子有點黃，不過清洗後還能用，希望下次能更注意挑選。', date: '2025-09-18', image: 'https://placehold.co/150x150/f0b400/000000?text=客戶實拍 (3★)', product: '有機菠菜 (300g)' },
];

const mockProducts = [
  { id: 1, name: '頂級有機白菜', price: 95, description: '每日現採，口感清甜脆嫩。', image: 'https://placehold.co/600x400/4CAF50/ffffff?text=有機白菜' },
  { id: 2, name: '屏東特選芒果', price: 180, description: '夏季限定，香甜多汁，果肉飽滿。', image: 'https://placehold.co/600x400/FF9800/ffffff?text=特選芒果' },
  { id: 3, name: '放山雞蛋 (12入)', price: 120, description: '自然放牧，蛋黃濃郁，營養豐富。', image: 'https://placehold.co/600x400/FBC02D/333333?text=放山雞蛋' },
  { id: 4, name: '新鮮鮭魚切片', price: 299, description: '急凍保鮮，富含Omega-3。', image: 'https://placehold.co/600x400/03A9F4/ffffff?text=新鮮鮭魚' },
  { id: 5, name: '高山冷泡茶包', price: 250, description: '嚴選茶葉，解渴回甘。', image: 'https://placehold.co/600x400/00BCD4/ffffff?text=高山茶包' },
  { id: 6, name: '黑毛豬五花肉', price: 165, description: '油花均勻，肉質鮮嫩Q彈。', image: 'https://placehold.co/600x400/795548/ffffff?text=黑毛豬肉' },
];

// --- 評價相關元件 ---

// 評價星級選擇元件 (點擊區域修正版)
const StarRating = ({ rating, setRating, isEditable = true }) => {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        // 使用 span 包裹 Star 元件，確保點擊區域穩定
        <span
          key={star}
          className={`transition-colors duration-150 ${isEditable ? 'cursor-pointer hover:text-sky-500' : ''}`}
          // 將互動屬性移到 span 標籤
          role={isEditable ? "button" : undefined}
          tabIndex={isEditable ? "0" : undefined}
          onClick={() => isEditable && setRating(star)}
          onKeyDown={(e) => {
            if (isEditable && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              setRating(star);
            }
          }}
        >
          <Star
            fill={star <= rating ? 'currentColor' : 'none'}
            className={`w-6 h-6 text-yellow-400`}
          />
        </span>
      ))}
    </div>
  );
};

// 單一評價展示卡片
const ReviewCard = ({ review }) => (
  <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-lg hover:shadow-xl transition duration-300 mb-4">
    <div className="flex justify-between items-start mb-3">
      <div>
        <StarRating rating={review.rating} setRating={() => {}} isEditable={false} />
        <p className="text-sm font-semibold text-gray-700 mt-1">
          {review.user} • 針對 <span className="text-sky-600 font-bold">{review.product}</span>
        </p>
      </div>
      <span className="text-xs text-gray-500">{review.date}</span>
    </div>

    <p className="text-gray-800 mb-4 italic">
      "{review.comment}"
    </p>

    {review.image && (
      <img
        src={review.image}
        alt="客戶實拍照片"
        className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
      />
    )}
  </div>
);

// 新增評價表單
const NewReviewForm = ({ onReviewSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [submissionError, setSubmissionError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmissionError('');

    if (rating === 0) {
        setSubmissionError("請給予星級評分 (1-5 顆星)。");
        return;
    }

    if (comment.trim() === '') {
        setSubmissionError("請填寫評論內容。");
        return;
    }

    const newReview = {
        id: Date.now(),
        user: '新客戶 (您)',
        rating,
        comment,
        date: new Date().toISOString().split('T')[0],
        image: imageFile ? 'https://placehold.co/150x150/06b6d4/ffffff?text=您的上傳照片' : null,
        product: '某個商品',
    };

    onReviewSubmit(newReview);

    setRating(0);
    setComment('');
    setImageFile(null);
    setSubmissionError("評價提交成功！感謝您的分享。");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size < 2 * 1024 * 1024) {
        setImageFile(file);
        setSubmissionError('');
    } else {
        setImageFile(null);
        setSubmissionError("檔案太大或格式不符 (需小於 2MB)。");
    }
  };

  const isRatingError = submissionError.includes('星級評分');

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white rounded-xl shadow-xl border-t-4 border-sky-500">
      <h2 className="text-xl font-bold text-gray-800 mb-4">留下您的真實評價</h2>

      {/* 顯示錯誤或成功訊息的區塊 */}
      {submissionError && (
          <div className={`p-3 mb-4 rounded-lg text-sm font-medium transition duration-300 ${
            submissionError.includes('成功') ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'
          }`}>
              {submissionError}
          </div>
      )}


      {/* 1. 星級選擇 - 新增視覺化錯誤提示 */}
      <div className={`mb-4 p-2 rounded-lg transition duration-200 ${isRatingError ? 'border border-red-500 bg-red-50' : ''}`}>
        <label className={`block font-medium mb-1 required-field ${isRatingError ? 'text-red-700' : 'text-gray-700'}`}>
            整體評分
        </label>
        <StarRating rating={rating} setRating={setRating} isEditable={true} />
      </div>

      {/* 2. 評論文字區 */}
      <div className="mb-4">
        <label htmlFor="comment" className="block text-gray-700 font-medium mb-1 required-field">評論內容</label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows="3"
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-sky-500 focus:border-sky-500 transition duration-150 resize-none"
          placeholder="請描述新鮮度與口感..."
          required
        ></textarea>
      </div>

      {/* 3. 照片上傳 (有圖佐證) */}
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">上傳照片佐證 (選填)</label>
        <div className="flex items-center space-x-4">
          <input
            type="file"
            id="photo-upload"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <label
            htmlFor="photo-upload"
            className="cursor-pointer flex items-center justify-center p-2 text-sm bg-gray-100 border border-dashed border-gray-400 rounded-lg text-gray-600 hover:bg-gray-200 transition duration-150"
          >
            <Camera className="w-4 h-4 mr-1" />
            {imageFile ? `已選擇: ${imageFile.name.substring(0, 10)}...` : '點擊上傳照片'}
          </label>
          {imageFile && (
            <img src={URL.createObjectURL(imageFile)} alt="上傳預覽" className="w-10 h-10 object-cover rounded-md" />
          )}
        </div>
      </div>

      {/* 4. 提交按鈕 */}
      <button
        type="submit"
        className="w-full py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition duration-200 shadow-md focus:outline-none focus:ring-4 focus:ring-sky-300"
      >
        提交評價
      </button>
      <style jsx global>{`
        .required-field::after {
          content: ' *';
          color: #ef4444; /* Tailwind red-500 */
        }
      `}</style>
    </form>
  );
};

// --- 商品卡片元件 ---
const ProductCard = ({ product }) => (
  <div className="bg-white rounded-xl shadow-xl overflow-hidden transform hover:scale-[1.02] transition duration-300 border border-gray-100">
    {/* 圖片區 */}
    <img
      src={product.image}
      alt={product.name}
      className="w-full h-48 object-cover"
      // 圖片載入失敗的備用處理
      onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/600x400/f0f0f0/333333?text=圖片載入失敗" }}
    />
    {/* 內容區 */}
    <div className="p-5">
      <h3 className="text-xl font-bold text-gray-800 mb-1">{product.name}</h3>
      <p className="text-sm text-gray-500 h-10 overflow-hidden">{product.description}</p>

      {/* 價格與按鈕 */}
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
        <span className="text-2xl font-extrabold text-red-600">
          ${product.price}
          <span className="text-base text-gray-500 font-normal ml-1">TWD</span>
        </span>
        <button className="bg-sky-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-sky-600 transition duration-150 shadow-md">
          加入購物車
        </button>
      </div>
    </div>
  </div>
);


// --- 導航元件 ---
const NavBar = ({ currentPage, setCurrentPage }) => {
  const navItems = [
    { name: '商品總覽', key: 'home', icon: Home },
    { name: '顧客評價', key: 'reviews', icon: Users },
    { name: '結帳流程', key: 'checkout', icon: ShoppingCart },
  ];

  return (
    <nav className="bg-sky-600 shadow-lg sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-white text-xl font-bold tracking-wider">
                IGB 網路菜市場
              </span>
            </div>
            {/* 桌面導航 */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setCurrentPage(item.key)}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition duration-150 ${
                    currentPage === item.key
                      ? 'bg-sky-700 text-white shadow-inner ring-2 ring-sky-300'
                      : 'text-sky-100 hover:bg-sky-500 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-1" />
                  {item.name}
                </button>
              ))}
            </div>
          </div>
          {/* 行動裝置漢堡菜單 (省略實作，維持簡潔) */}
        </div>
      </div>
    </nav>
  );
};

// --- 頁面元件 ---

// 1. 商品總覽頁面 (Dashboard Placeholder) - UI/UX 增強
const HomePage = () => (
  <div className="max-w-7xl mx-auto p-4 sm:p-8">
    <h2 className="text-4xl font-extrabold text-gray-900 mb-8 border-b-4 border-sky-400 inline-block pb-1">
      今日推薦新鮮食材
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {mockProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  </div>
);

// 2. 結帳流程頁面 (UX 範例 Placeholder)
const CheckoutPage = () => (
  <div className="max-w-7xl mx-auto p-4 sm:p-8">
    <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">結帳流程 (分步 UX 範例)</h2>
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6 text-sm font-medium text-gray-500">
        <div className="text-sky-600 font-bold border-b-2 border-sky-600 pb-1">1. 收件資訊</div>
        <div>{'->'} 2. 付款方式</div>
        <div>{'->'} 3. 訂單確認</div>
      </div>
      <p className="text-gray-700">此處為分步結帳表單的內容，旨在優化 UX，減少單頁的認知負荷。</p>
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <p className="font-semibold">訂單摘要 (固定側欄區塊)</p>
        <p>總金額: $1,250 TWD</p>
      </div>
    </div>
  </div>
);

// 3. 顧客評價頁面 (實作 ReviewSystem)
const ReviewsPage = () => {
  const [reviews, setReviews] = useState(mockReviews);

  const handleReviewSubmit = (newReview) => {
    setReviews([newReview, ...reviews]);
    console.log("新評價已提交，請檢查控制台 (Console) 或實際後端儲存邏輯:", newReview);
  };

  return (
    <div className="min-h-full bg-gray-50 p-4 sm:p-8">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-sky-700">顧客評價 - 有圖有真相</h1>
        <p className="text-lg text-gray-600 mt-2">真實顧客分享，為您的購買決策提供參考。</p>
      </header>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* 左側：新增評價表單 (佔 1/3 寬度) */}
        <div className="lg:col-span-1">
          <NewReviewForm onReviewSubmit={handleReviewSubmit} />
        </div>

        {/* 右側：歷史評價清單 (佔 2/3 寬度) */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">所有顧客評價 ({reviews.length})</h2>
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>

          {reviews.length === 0 && (
              <div className="text-center text-gray-500 py-10 border border-dashed rounded-xl">
                  目前沒有評價，快來成為第一個分享經驗的顧客吧！
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 主要應用程式元件 ---
export default function App() {
  const [currentPage, setCurrentPage] = useState('home'); // 預設頁面

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'reviews':
        return <ReviewsPage />;
      case 'checkout':
        return <CheckoutPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <NavBar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="pb-10">
        {renderPage()}
      </main>
    </div>
  );
}
