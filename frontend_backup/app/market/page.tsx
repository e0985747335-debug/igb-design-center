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
