import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    onSnapshot, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc,
    query
} from 'firebase/firestore';

// 確保字型和視圖配置
const headContent = document.head.innerHTML;
if (!headContent.includes('viewport')) {
  document.head.innerHTML += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
}
if (!headContent.includes('Inter')) {
  document.head.innerHTML += '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">';
}

// ------------------------------------
// 1. Firebase 初始化與配置
// ------------------------------------

// 從 Canvas 環境變量獲取配置
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : undefined;

let app, db, auth;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
} catch (e) {
    console.error("Firebase Initialization Error:", e);
}

// ------------------------------------
// 2. 數據模型與類型
// ------------------------------------

/**
 * @typedef {Object} Product
 * @property {string} id - 文件 ID
 * @property {string} name - 商品名稱
 * @property {string} vendorId - 廠商 ID
 * @property {string} description - 商品描述
 * @property {string} imageUrl - 模擬的圖片 URL
 * @property {number} price - 價格
 * @property {number} stock - 庫存
 */

/**
 * @typedef {Object} Vendor
 * @property {string} id - 文件 ID
 * @property {string} name - 廠商名稱
 * @property {string} contact - 聯絡人
 * @property {string} phone - 電話
 */


// ------------------------------------
// 3. 通用 UI 組件
// ------------------------------------

/**
 * 簡單的 loading 旋轉器
 */
const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-4">
        <svg className="animate-spin h-5 w-5 mr-3 text-indigo-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        載入中...
    </div>
);

/**
 * 輸入欄位組件
 */
const InputField = ({ label, type = 'text', value, onChange, placeholder = '' }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out shadow-sm"
        />
    </div>
);

/**
 * 模擬圖片上傳的輸入欄位
 * 由於是單一檔案應用程式，我們使用 URL 輸入來模擬圖片上傳
 */
const ImageUploadSimulation = ({ imageUrl, onChange }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">商品圖片 URL (模擬上傳)</label>
        <div className="flex items-center space-x-2">
            <input
                type="text"
                value={imageUrl}
                onChange={onChange}
                placeholder="請輸入圖片 URL (e.g. https://placehold.co/150x150)"
                className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            />
            {imageUrl && (
                <img
                    src={imageUrl}
                    alt="預覽"
                    className="w-16 h-16 object-cover rounded-md border border-gray-200"
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/150x150/ef4444/ffffff?text=無圖"; }}
                />
            )}
        </div>
    </div>
);

/**
 * 主要操作按鈕組件
 */
const ActionButton = ({ onClick, children, className = 'bg-indigo-600 hover:bg-indigo-700' }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-white font-medium rounded-lg shadow-md transition duration-200 ease-in-out ${className} active:scale-[0.98] transform`}
    >
        {children}
    </button>
);


// ------------------------------------
// 4. Firebase CRUD 服務
// ------------------------------------

/**
 * 獲取 Firestore 集合的路徑
 * @param {string} userId - 當前用戶 ID
 * @param {string} collectionName - 集合名稱 (e.g., 'products', 'vendors')
 * @returns {import('firebase/firestore').CollectionReference}
 */
const getCollectionRef = (userId, collectionName) => {
    // 私人數據路徑: /artifacts/{appId}/users/{userId}/{collectionName}
    return collection(db, `artifacts/${appId}/users/${userId}/${collectionName}`);
};

/**
 * 獲取所有數據 (使用 onSnapshot 實現即時監聽)
 * @param {string} userId - 當前用戶 ID
 * @param {string} collectionName - 集合名稱
 * @param {function} setData - 設置數據的 React State 函數
 * @returns {function} unsubscribe 函數
 */
const subscribeToData = (userId, collectionName, setData) => {
    if (!db || !userId) return () => {};

    const q = query(getCollectionRef(userId, collectionName));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setData(items);
    }, (error) => {
        console.error(`Error fetching ${collectionName}:`, error);
        // 如果錯誤發生，仍嘗試設置空陣列以避免應用程式鎖死
        setData([]); 
    });

    return unsubscribe;
};

/**
 * 新增數據
 * @param {string} userId - 當前用戶 ID
 * @param {string} collectionName - 集合名稱
 * @param {Object} data - 要新增的數據
 */
const addData = async (userId, collectionName, data) => {
    if (!db || !userId) return console.error("Database or User ID not available.");
    try {
        await addDoc(getCollectionRef(userId, collectionName), data);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
};

/**
 * 更新數據
 * @param {string} userId - 當前用戶 ID
 * @param {string} collectionName - 集合名稱
 * @param {string} id - 文件 ID
 * @param {Object} data - 要更新的數據
 */
const updateData = async (userId, collectionName, id, data) => {
    if (!db || !userId) return console.error("Database or User ID not available.");
    try {
        const docRef = doc(db, `artifacts/${appId}/users/${userId}/${collectionName}`, id);
        await updateDoc(docRef, data);
    } catch (e) {
        console.error("Error updating document: ", e);
    }
};

/**
 * 刪除數據
 * @param {string} userId - 當前用戶 ID
 * @param {string} collectionName - 集合名稱
 * @param {string} id - 文件 ID
 */
const deleteData = async (userId, collectionName, id) => {
    if (!db || !userId) return console.error("Database or User ID not available.");
    try {
        const docRef = doc(db, `artifacts/${appId}/users/${userId}/${collectionName}`, id);
        await deleteDoc(docRef);
    } catch (e) {
        console.error("Error deleting document: ", e);
    }
};


// ------------------------------------
// 5. 廠商管理 (Vendor Management) 組件
// ------------------------------------

/**
 * @param {{userId: string, vendors: Vendor[], setEditingVendor: function, deleteVendor: function}} props 
 */
const VendorManagement = ({ userId, vendors, setEditingVendor, deleteVendor }) => {
    const [newVendor, setNewVendor] = useState({ name: '', contact: '', phone: '' });

    const handleAddVendor = async () => {
        if (!newVendor.name || !newVendor.contact) {
            alert("請填寫廠商名稱和聯絡人！");
            return;
        }
        await addData(userId, 'vendors', newVendor);
        setNewVendor({ name: '', contact: '', phone: '' });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4">
            {/* 新增廠商表單 */}
            <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg h-fit border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">新增廠商</h2>
                <InputField 
                    label="廠商名稱" 
                    value={newVendor.name} 
                    onChange={e => setNewVendor({ ...newVendor, name: e.target.value })} 
                    placeholder="XYZ 科技公司"
                />
                <InputField 
                    label="聯絡人" 
                    value={newVendor.contact} 
                    onChange={e => setNewVendor({ ...newVendor, contact: e.target.value })} 
                    placeholder="王小明"
                />
                <InputField 
                    label="聯絡電話" 
                    type="tel"
                    value={newVendor.phone} 
                    onChange={e => setNewVendor({ ...newVendor, phone: e.target.value })} 
                    placeholder="09xx-xxx-xxx"
                />
                <ActionButton onClick={handleAddVendor} className="w-full">
                    新增廠商
                </ActionButton>
            </div>

            {/* 廠商列表 */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">廠商列表 ({vendors.length} 筆)</h2>
                {vendors.length === 0 ? (
                    <p className="text-gray-500 italic">尚無廠商資料。請新增。</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名稱</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">聯絡人</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">電話</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {vendors.map(vendor => (
                                    <tr key={vendor.id}>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vendor.name}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{vendor.contact}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{vendor.phone}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                            <button 
                                                onClick={() => setEditingVendor(vendor)} 
                                                className="text-indigo-600 hover:text-indigo-900 mr-3 text-sm"
                                            >
                                                編輯
                                            </button>
                                            <button 
                                                onClick={() => deleteVendor(vendor.id)} 
                                                className="text-red-600 hover:text-red-900 text-sm"
                                            >
                                                刪除
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};


// ------------------------------------
// 6. 商品管理 (Product Management) 組件
// ------------------------------------

/**
 * @param {{userId: string, products: Product[], vendors: Vendor[], setEditingProduct: function, deleteProduct: function}} props 
 */
const ProductManagement = ({ userId, products, vendors, setEditingProduct, deleteProduct }) => {
    const [newProduct, setNewProduct] = useState({ name: '', vendorId: '', description: '', imageUrl: '', price: 0, stock: 0 });
    const [searchTerm, setSearchTerm] = useState('');

    const handleAddProduct = async () => {
        if (!newProduct.name || !newProduct.vendorId || !newProduct.price) {
            alert("請填寫商品名稱、價格和廠商！");
            return;
        }
        await addData(userId, 'products', { 
            ...newProduct, 
            price: Number(newProduct.price) || 0,
            stock: Number(newProduct.stock) || 0,
        });
        setNewProduct({ name: '', vendorId: '', description: '', imageUrl: '', price: 0, stock: 0 });
    };

    const vendorMap = useMemo(() => {
        return vendors.reduce((map, vendor) => {
            map[vendor.id] = vendor.name;
            return map;
        }, {});
    }, [vendors]);

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (vendorMap[p.vendorId] && vendorMap[p.vendorId].toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4">
            {/* 新增商品表單 (商品上架) */}
            <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg h-fit border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">商品上架</h2>
                <InputField 
                    label="商品名稱" 
                    value={newProduct.name} 
                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} 
                    placeholder="筆記型電腦 X-5000"
                />
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">選擇廠商</label>
                    <select
                        value={newProduct.vendorId}
                        onChange={e => setNewProduct({ ...newProduct, vendorId: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out shadow-sm"
                    >
                        <option value="">-- 請選擇廠商 --</option>
                        {vendors.map(v => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                    </select>
                </div>
                <InputField 
                    label="價格 (TWD)" 
                    type="number"
                    value={newProduct.price} 
                    onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} 
                    placeholder="15000"
                />
                <InputField 
                    label="初始庫存" 
                    type="number"
                    value={newProduct.stock} 
                    onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} 
                    placeholder="100"
                />
                <ImageUploadSimulation
                    imageUrl={newProduct.imageUrl}
                    onChange={e => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                />
                 <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">商品描述</label>
                    <textarea
                        rows="3"
                        value={newProduct.description}
                        onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                        placeholder="高性能、輕薄設計的筆記型電腦..."
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out shadow-sm"
                    />
                </div>
                <ActionButton onClick={handleAddProduct} className="w-full">
                    上架新商品
                </ActionButton>
            </div>

            {/* 商品列表 (商品管理) */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">商品管理列表 ({filteredProducts.length} 筆)</h2>
                <InputField
                    label="搜尋商品/廠商"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="輸入商品名稱或廠商名稱進行篩選..."
                />
                {products.length === 0 ? (
                    <p className="text-gray-500 italic">尚無商品資料。請新增。</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {filteredProducts.map(product => (
                            <div key={product.id} className="flex bg-gray-50 p-3 rounded-lg shadow-sm hover:shadow-md transition duration-200 border border-gray-100">
                                <img
                                    src={product.imageUrl || "https://placehold.co/100x100/5b21b6/ffffff?text=無圖"}
                                    alt={product.name}
                                    className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100x100/ef4444/ffffff?text=無圖"; }}
                                />
                                <div className="ml-4 flex-grow">
                                    <p className="text-md font-bold text-gray-900 truncate" title={product.name}>{product.name}</p>
                                    <p className="text-xs text-indigo-600 mb-1">{vendorMap[product.vendorId] || '廠商未知'}</p>
                                    <p className="text-sm text-gray-600">價格: ${product.price.toLocaleString()}</p>
                                    <p className={`text-sm font-medium ${product.stock > 10 ? 'text-green-600' : 'text-red-500'}`}>
                                        庫存: {product.stock}
                                    </p>
                                </div>
                                <div className="flex flex-col justify-between items-end">
                                    <button 
                                        onClick={() => setEditingProduct(product)} 
                                        className="text-indigo-600 hover:text-indigo-900 text-sm mb-2"
                                    >
                                        編輯
                                    </button>
                                    <button 
                                        onClick={() => deleteProduct(product.id)} 
                                        className="text-red-600 hover:text-red-900 text-sm"
                                    >
                                        刪除
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


// ------------------------------------
// 7. 編輯/模態框組件
// ------------------------------------

/**
 * 產品編輯模態框
 * @param {{product: Product, vendors: Vendor[], userId: string, setEditingProduct: function}} props 
 */
const ProductEditModal = ({ product, vendors, userId, setEditingProduct }) => {
    const [formData, setFormData] = useState(product);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'number' ? Number(value) : value 
        }));
    };

    const handleSave = async () => {
        if (!formData.name || !formData.vendorId || !formData.price) {
            alert("請填寫商品名稱、價格和廠商！");
            return;
        }
        await updateData(userId, 'products', formData.id, { 
            name: formData.name, 
            vendorId: formData.vendorId, 
            description: formData.description, 
            imageUrl: formData.imageUrl, 
            price: Number(formData.price), 
            stock: Number(formData.stock) 
        });
        setEditingProduct(null); // 關閉模態框
    };

    if (!product) return null;

    return (
        <Modal title="編輯商品資料" onClose={() => setEditingProduct(null)}>
            <InputField label="ID" value={formData.id} readOnly={true} />
            <InputField 
                label="商品名稱" 
                name="name"
                value={formData.name} 
                onChange={handleChange} 
            />
             <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">選擇廠商</label>
                <select
                    name="vendorId"
                    value={formData.vendorId}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out shadow-sm"
                >
                    <option value="">-- 請選擇廠商 --</option>
                    {vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                </select>
            </div>
            <InputField 
                label="價格 (TWD)" 
                name="price"
                type="number"
                value={formData.price} 
                onChange={handleChange} 
            />
            <InputField 
                label="庫存" 
                name="stock"
                type="number"
                value={formData.stock} 
                onChange={handleChange} 
            />
            <ImageUploadSimulation
                imageUrl={formData.imageUrl}
                onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
            />
             <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">商品描述</label>
                <textarea
                    rows="3"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out shadow-sm"
                />
            </div>
            <ActionButton onClick={handleSave} className="w-full mt-4">
                儲存變更
            </ActionButton>
        </Modal>
    );
};


/**
 * 廠商編輯模態框
 * @param {{vendor: Vendor, userId: string, setEditingVendor: function}} props 
 */
const VendorEditModal = ({ vendor, userId, setEditingVendor }) => {
    const [formData, setFormData] = useState(vendor);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!formData.name || !formData.contact) {
            alert("請填寫廠商名稱和聯絡人！");
            return;
        }
        await updateData(userId, 'vendors', formData.id, formData);
        setEditingVendor(null); // 關閉模態框
    };

    if (!vendor) return null;

    return (
        <Modal title="編輯廠商資料" onClose={() => setEditingVendor(null)}>
            <InputField label="ID" value={formData.id} readOnly={true} />
            <InputField 
                label="廠商名稱" 
                name="name"
                value={formData.name} 
                onChange={handleChange} 
            />
            <InputField 
                label="聯絡人" 
                name="contact"
                value={formData.contact} 
                onChange={handleChange} 
            />
            <InputField 
                label="聯絡電話" 
                name="phone"
                type="tel"
                value={formData.phone} 
                onChange={handleChange} 
            />
            <ActionButton onClick={handleSave} className="w-full mt-4">
                儲存變更
            </ActionButton>
        </Modal>
    );
};


/**
 * 通用模態框結構
 */
const Modal = ({ title, children, onClose }) => (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50 p-4 transition-opacity duration-300">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform scale-100 transition-transform duration-300">
            <div className="p-6 border-b flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                <button 
                    onClick={onClose} 
                    className="text-gray-400 hover:text-gray-600 transition"
                    aria-label="關閉"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    </div>
);


// ------------------------------------
// 8. 主應用程式組件
// ------------------------------------

const App = () => {
    const [products, setProducts] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [activeTab, setActiveTab] = useState('products'); // 'products' or 'vendors'
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingVendor, setEditingVendor] = useState(null);

    // 認證處理與數據訂閱
    useEffect(() => {
        if (!auth) {
            console.error("Firebase Auth not available.");
            setIsAuthReady(true); // 即使出錯也標記為完成，以便顯示錯誤訊息
            return;
        }

        const handleAuth = async () => {
            try {
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("Firebase authentication failed:", error);
            }
        };

        handleAuth();

        // 設置 Auth 狀態變更監聽器
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                setUserId(crypto.randomUUID()); // 未登入則使用隨機 ID
            }
            setIsAuthReady(true);
        });

        return () => unsubscribeAuth();
    }, []); // 只運行一次

    // Firestore 數據即時監聽
    useEffect(() => {
        if (userId && isAuthReady) {
            // 監聽產品數據
            const unsubscribeProducts = subscribeToData(userId, 'products', setProducts);
            // 監聽廠商數據
            const unsubscribeVendors = subscribeToData(userId, 'vendors', setVendors);
            
            return () => {
                unsubscribeProducts();
                unsubscribeVendors();
            };
        }
    }, [userId, isAuthReady]);


    // 處理刪除
    const handleDeleteProduct = (id) => {
        if (window.confirm("確定要刪除此商品嗎？")) {
            deleteData(userId, 'products', id);
        }
    };

    const handleDeleteVendor = (id) => {
        if (window.confirm("確定要刪除此廠商嗎？此操作不可逆！")) {
            // 可以在此處加入邏輯檢查是否有商品依賴此廠商
            deleteData(userId, 'vendors', id);
        }
    };


    if (!isAuthReady) {
        return <LoadingSpinner />;
    }

    if (!userId || !db) {
         return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-center p-6 bg-white rounded-xl shadow-lg">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">系統錯誤</h1>
                    <p className="text-gray-600">無法初始化 Firebase 或獲取用戶 ID。請檢查配置。</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-['Inter']">
            {/* 頂部標題與 Tab 切換 */}
            <header className="bg-white shadow-md sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center py-4">
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 md:mb-0">
                            ERP 2.0 戰略指揮中心
                        </h1>
                        <p className="text-sm text-gray-500">
                            用戶 ID: <span className="font-mono text-xs bg-gray-100 p-1 rounded-md">{userId}</span>
                        </p>
                    </div>
                    
                    {/* Tab 切換 */}
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`py-3 px-6 text-sm font-medium transition duration-150 ease-in-out ${
                                activeTab === 'products'
                                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            商品管理 / 商品上架
                        </button>
                        <button
                            onClick={() => setActiveTab('vendors')}
                            className={`py-3 px-6 text-sm font-medium transition duration-150 ease-in-out ${
                                activeTab === 'vendors'
                                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            廠商管理
                        </button>
                    </div>
                </div>
            </header>

            {/* 主要內容區域 */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'products' && (
                    <ProductManagement 
                        userId={userId} 
                        products={products} 
                        vendors={vendors} 
                        setEditingProduct={setEditingProduct}
                        deleteProduct={handleDeleteProduct}
                    />
                )}
                {activeTab === 'vendors' && (
                    <VendorManagement 
                        userId={userId} 
                        vendors={vendors} 
                        setEditingVendor={setEditingVendor}
                        deleteVendor={handleDeleteVendor}
                    />
                )}
            </main>

            {/* 模態框 (用於編輯) */}
            <ProductEditModal 
                product={editingProduct} 
                vendors={vendors}
                userId={userId} 
                setEditingProduct={setEditingProduct} 
            />
            <VendorEditModal 
                vendor={editingVendor} 
                userId={userId} 
                setEditingVendor={setEditingVendor} 
            />
        </div>
    );
};

export default App;
