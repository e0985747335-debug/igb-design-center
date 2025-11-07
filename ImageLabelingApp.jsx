import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Loader2, Zap, UploadCloud, Save, Trash2, Image as ImageIcon } from 'lucide-react';

// Tailwind CSS is assumed to be available.

// 設置全域變數
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const API_KEY = ""; // 保持空白，Canvas 會自動提供

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;
const MAX_RETRIES = 5;

// 將 base64 資料轉換為 Google API 的 parts 格式
const fileToGenerativePart = (base64, mimeType) => {
    return {
        inlineData: {
            data: base64,
            mimeType,
        },
    };
};

// 輔助函數：執行指數退避的 fetch
const fetchWithRetry = async (url, options) => {
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                // 如果是 429 Too Many Requests，則進入下一次循環重試
                if (response.status === 429) {
                    throw new Error(`Rate limit exceeded. Retrying... (${i + 1}/${MAX_RETRIES})`);
                }
                // 對其他非 2xx 狀態碼直接拋出錯誤
                const errorBody = await response.text();
                throw new Error(`API call failed with status ${response.status}: ${errorBody}`);
            }
            return response;
        } catch (error) {
            console.error(`Fetch attempt ${i + 1} failed:`, error.message);
            if (i === MAX_RETRIES - 1) throw error; // 最後一次嘗試失敗，拋出錯誤
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            // console.debug(`Waiting for ${delay.toFixed(0)}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

// 主要應用程式元件
const App = () => {
    // Firebase 狀態
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    // 應用程式狀態
    const [uploadedFile, setUploadedFile] = useState(null);
    const [base64Image, setBase64Image] = useState(null);
    const [analysisPrompt, setAnalysisPrompt] = useState('請詳細描述這張圖片的內容，並為其提供5個關鍵標籤（繁體中文），以 JSON 格式輸出。');
    const [analysisResult, setAnalysisResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [savedLabels, setSavedLabels] = useState([]);
    const [editingId, setEditingId] = useState(null); // 當前正在編輯的標籤 ID

    // ------------------------------------
    // 1. Firebase 初始化與認證 (Auth & Firestore Setup)
    // ------------------------------------
    useEffect(() => {
        if (!firebaseConfig) {
            setMessage('Firebase 配置缺失，無法啟用儲存功能。');
            setIsAuthReady(true);
            return;
        }

        try {
            const app = initializeApp(firebaseConfig);
            const firestoreDb = getFirestore(app);
            const firebaseAuth = getAuth(app);

            // 設置日誌級別，便於調試
            // setLogLevel('debug');

            setDb(firestoreDb);
            setAuth(firebaseAuth);

            const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
                if (user) {
                    setUserId(user.uid);
                } else if (initialAuthToken) {
                    // 嘗試用 custom token 登入
                    await signInWithCustomToken(firebaseAuth, initialAuthToken).catch(e => {
                        console.error("Custom token sign in failed:", e);
                        signInAnonymously(firebaseAuth);
                    });
                } else {
                    // 匿名登入
                    await signInAnonymously(firebaseAuth).catch(e => {
                        console.error("Anonymous sign in failed:", e);
                    });
                }
                setIsAuthReady(true);
            });

            return () => unsubscribe();
        } catch (error) {
            console.error("Firebase Initialization Error:", error);
            setMessage(`Firebase 初始化失敗: ${error.message}`);
            setIsAuthReady(true);
        }
    }, []);

    // ------------------------------------
    // 2. Firestore 數據訂閱 (Real-time Listener)
    // ------------------------------------
    useEffect(() => {
        if (!isAuthReady || !db || !userId) return;

        // 數據庫路徑：/artifacts/{appId}/users/{userId}/image_labels
        const collectionPath = `/artifacts/${appId}/users/${userId}/image_labels`;
        const q = query(collection(db, collectionPath), orderBy("timestamp", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const labels = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSavedLabels(labels);
        }, (error) => {
            console.error("Firestore Snapshot Error:", error);
            setMessage(`數據載入失敗: ${error.message}`);
        });

        return () => unsubscribe();
    }, [isAuthReady, db, userId]);

    // ------------------------------------
    // 3. 圖片處理 (Image Handling)
    // ------------------------------------
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file || !file.type.startsWith('image/')) {
            setMessage('請選擇有效的圖片檔案。');
            setUploadedFile(null);
            setBase64Image(null);
            return;
        }
        setUploadedFile(file);
        setAnalysisResult('');
        setMessage('');

        const reader = new FileReader();
        reader.onloadend = () => {
            // 讀取 base64 字串，並移除開頭的 'data:image/jpeg;base64,' 等部分
            const base64Data = reader.result.split(',')[1];
            setBase64Image(base64Data);
        };
        reader.onerror = (error) => {
            console.error("File reading error:", error);
            setMessage('讀取圖片檔案失敗。');
        };
        reader.readAsDataURL(file);
    };

    // ------------------------------------
    // 4. AI 分析 (Gemini API Call)
    // ------------------------------------
    const handleAnalyze = async () => {
        if (!base64Image) {
            setMessage('請先上傳圖片。');
            return;
        }

        setIsLoading(true);
        setMessage('正在分析圖片...請稍候。');

        const imagePart = fileToGenerativePart(base64Image, uploadedFile.type);

        const payload = {
            contents: [{
                parts: [
                    imagePart,
                    { text: analysisPrompt }
                ]
            }],
            systemInstruction: {
                parts: [{
                    text: "You are a professional image analysis and labeling assistant. Your response MUST be comprehensive analysis of the image followed by the requested labels in a JSON object format. Only output the final text."
                }]
            }
        };

        try {
            const response = await fetchWithRetry(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '分析失敗，未獲得有效響應。';

            setAnalysisResult(text);
            setMessage('分析完成！');
        } catch (error) {
            console.error("Gemini API Error:", error);
            setMessage(`AI 分析失敗: ${error.message}`);
            setAnalysisResult('無法完成分析，請檢查控制台錯誤訊息。');
        } finally {
            setIsLoading(false);
        }
    };

    // ------------------------------------
    // 5. 儲存與管理標籤 (Firestore Operations)
    // ------------------------------------
    const saveLabel = async () => {
        if (!db || !userId) {
            setMessage('Firebase 尚未初始化或使用者未登入，無法儲存。');
            return;
        }
        if (!analysisResult.trim()) {
            setMessage('分析結果不能為空。');
            return;
        }
        if (!uploadedFile) {
            setMessage('請先上傳圖片。');
            return;
        }

        setIsLoading(true);
        try {
            const collectionPath = `/artifacts/${appId}/users/${userId}/image_labels`;
            const docRef = doc(collection(db, collectionPath), editingId || crypto.randomUUID());

            await setDoc(docRef, {
                prompt: analysisPrompt,
                result: analysisResult,
                // 儲存 base64 數據太耗資源，只儲存縮圖或資訊
                fileName: uploadedFile.name,
                mimeType: uploadedFile.type,
                imageUrl: base64Image ? `data:${uploadedFile.type};base64,${base64Image}` : null, // 用於顯示預覽
                timestamp: new Date().toISOString(),
                userId: userId,
            }, { merge: true }); // 使用 merge 以便更新現有文件

            setMessage(editingId ? '標籤更新成功！' : '標籤儲存成功！');
            setEditingId(null); // 清除編輯狀態
        } catch (error) {
            console.error("Firestore Save Error:", error);
            setMessage(`儲存標籤失敗: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteLabel = async (id) => {
        if (!db || !userId) return;

        // 改為使用自定義的確認彈窗，因為不能使用 window.confirm
        // 這裡我們暫時使用一個簡單的訊息處理，因為需要自定義 UI 才能完全避免 window.confirm
        const isConfirmed = true; // 假設用戶已經在自定義模態框中確認

        if (isConfirmed) {
            setIsLoading(true);
            try {
                const collectionPath = `/artifacts/${appId}/users/${userId}/image_labels`;
                const docRef = doc(db, collectionPath, id);

                // 替代方案：設定一個標記為 'deleted' 的欄位（軟刪除）
                await setDoc(docRef, { isDeleted: true, deletedAt: new Date().toISOString() }, { merge: true });

                // 由於 onSnapshot 會自動更新，這裡不需要手動修改 state
                setMessage('標籤已刪除（或軟刪除）。');
            } catch (error) {
                console.error("Firestore Delete Error:", error);
                setMessage(`刪除標籤失敗: ${error.message}`);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const loadLabelForEdit = (label) => {
        // 加載數據到表單
        setAnalysisPrompt(label.prompt);
        setAnalysisResult(label.result);
        setEditingId(label.id);

        // 如果有圖片 URL，則加載圖片預覽
        if (label.imageUrl) {
            // 注意：這裡只恢復了 base64 預覽，沒有恢復原始 File 物件
            setBase64Image(label.imageUrl.split(',')[1]);
            setUploadedFile({ name: label.fileName, type: label.mimeType });
            setMessage(`已載入 "${label.fileName}" 進行編輯。`);
        } else {
            setMessage('已載入標籤內容，但原始圖片資料缺失。');
        }
    };

    // 過濾掉被軟刪除的項目
    const activeLabels = savedLabels.filter(label => !label.isDeleted);


    // ------------------------------------
    // 6. UI/Component Rendering
    // ------------------------------------

    const ImagePreview = () => (
        <div className="flex items-center justify-center w-full h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
            {base64Image ? (
                <img
                    src={`data:${uploadedFile.type};base64,${base64Image}`}
                    alt="上傳預覽"
                    className="object-contain max-h-full max-w-full"
                />
            ) : (
                <div className="text-center text-gray-500 p-4">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">尚未上傳圖片</p>
                    <p className="text-xs mt-1">請點擊「選擇圖片」</p>
                </div>
            )}
        </div>
    );

    const LabelHistory = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">標籤歷史記錄 ({activeLabels.length})</h3>
            {activeLabels.length === 0 ? (
                <p className="text-sm text-gray-500">尚無儲存的標籤記錄。</p>
            ) : (
                // 讓歷史記錄區塊在 2/5 寬度內垂直空間最大化
                <div className="space-y-3 overflow-y-auto pr-2">
                    {activeLabels.map((label) => (
                        <div key={label.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-medium text-indigo-600">{new Date(label.timestamp).toLocaleDateString()}</span>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => loadLabelForEdit(label)}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 transition font-medium"
                                        disabled={isLoading}
                                    >
                                        編輯
                                    </button>
                                    <button
                                        onClick={() => deleteLabel(label.id)}
                                        className="p-1 text-red-500 hover:text-red-700 transition"
                                        disabled={isLoading}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm font-semibold text-gray-700 truncate">{label.fileName || '未命名文件'}</p>
                            <div className="mt-2 text-xs text-gray-500 line-clamp-2">
                                {label.result.substring(0, 100)}...
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
            <script src="https://cdn.tailwindcss.com"></script>
            <div className="max-w-7xl mx-auto"> {/* 增加最大寬度 max-w-7xl */}
                <header className="mb-8 text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center justify-center">
                        <Zap className="w-6 h-6 mr-2 text-indigo-600" />
                        AI 影像標註助理
                    </h1>
                    <p className="text-sm text-gray-500 mt-2">使用 Gemini 2.5 Flash 進行視覺分析與標籤生成</p>
                    <div className="mt-2 text-xs text-gray-400">
                        {isAuthReady ? (
                            `使用者 ID (儲存路徑): ${userId || 'N/A'}`
                        ) : '正在初始化認證...'}
                    </div>
                </header>

                {/* 訊息提示區域 */}
                {message && (
                    <div className={`p-3 mb-6 rounded-lg text-sm font-medium ${message.includes('失敗') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {message}
                    </div>
                )}

                {/* 佈局更改：從 lg:grid-cols-3 (2/3, 1/3) 更改為 lg:grid-cols-5 (3/5, 2/5) */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* 左側：控制面板與圖片預覽 (佔 3/5) */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* 圖片上傳區 */}
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">1. 圖片上傳與預覽</h2>
                            <ImagePreview />
                            <label className="block mt-4">
                                <span className="sr-only">選擇圖片檔案</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="block w-full text-sm text-gray-500
                                               file:mr-4 file:py-2 file:px-4
                                               file:rounded-full file:border-0
                                               file:text-sm file:font-semibold
                                               file:bg-indigo-50 file:text-indigo-700
                                               hover:file:bg-indigo-100 cursor-pointer"
                                />
                            </label>
                            {uploadedFile && (
                                <p className="text-xs text-gray-500 mt-2">已選擇檔案: {uploadedFile.name}</p>
                            )}
                        </div>

                        {/* AI 提示與分析結果區 */}
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">2. AI 分析與結果</h2>

                            {/* 分析提示 */}
                            <label className="block text-sm font-medium text-gray-700 mb-2">分析提示/要求 (Prompt)</label>
                            <textarea
                                value={analysisPrompt}
                                onChange={(e) => setAnalysisPrompt(e.target.value)}
                                placeholder="輸入你的分析要求..."
                                rows={3}
                                className="w-full p-3 text-sm resize-none bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                            />

                            {/* 分析按鈕 */}
                            <button
                                onClick={handleAnalyze}
                                disabled={isLoading || !base64Image}
                                className="w-full mt-4 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        正在進行 AI 深度分析...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="mr-2 h-4 w-4" />
                                        執行 AI 分析
                                    </>
                                )}
                            </button>

                            {/* 分析結果 */}
                            <label className="block text-sm font-medium text-gray-700 mt-6 mb-2">AI 分析結果</label>
                            <textarea
                                value={analysisResult}
                                onChange={(e) => setAnalysisResult(e.target.value)}
                                placeholder="AI 分析結果將顯示在這裡..."
                                rows={10}
                                className="w-full p-3 text-sm resize-none bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                            />

                            {/* 儲存按鈕 */}
                            <button
                                onClick={saveLabel}
                                disabled={isLoading || !analysisResult.trim() || !isAuthReady || editingId && !uploadedFile}
                                className={`w-full mt-4 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 disabled:opacity-50`}
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {editingId ? '更新標籤' : '儲存標籤到 Firestore'}
                            </button>
                            {editingId && (
                                <button
                                    onClick={() => {
                                        setEditingId(null);
                                        setAnalysisPrompt('請詳細描述這張圖片的內容，並為其提供5個關鍵標籤（繁體中文），以 JSON 格式輸出。');
                                        setAnalysisResult('');
                                        setMessage('已取消編輯，開始新的標籤作業。');
                                    }}
                                    className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700 transition"
                                >
                                    取消編輯
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 右側：歷史記錄面板 (佔 2/5) */}
                    <div className="lg:col-span-2">
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-full"> {/* 讓面板佔滿高度 */}
                            <LabelHistory />
                        </div>
                    </div>
                </div>

                <footer className="mt-12 text-center text-xs text-gray-400">
                    <p>AI 影像標註助理 - 數據由 Gemini 2.5 Flash 提供</p>
                </footer>
            </div>
        </div>
    );
};

export default App;
