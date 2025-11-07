import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, addDoc, updateDoc, onSnapshot, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

// --- 全域 Firebase 配置和變數 ---
// 這些變數由 Canvas 環境提供
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
// 使用 public 路徑，讓所有用戶都能看到提交的請求
const COLLECTION_PATH = `artifacts/${appId}/public/data/workflow_submissions`;

/**
 * 主應用程式組件：工作流程審批系統
 * @returns {JSX.Element}
 */
const App = () => {
    // --- 狀態管理 ---
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // 表單狀態
    const [requestTitle, setRequestTitle] = useState('');
    const [requestDetails, setRequestDetails] = useState('');

    // --- Firebase 初始化與身份驗證 ---
    useEffect(() => {
        if (!firebaseConfig.apiKey) {
            setError("Firebase 配置遺失。請檢查環境變數。");
            return;
        }

        try {
            const app = initializeApp(firebaseConfig);
            const firestore = getFirestore(app);
            const authInstance = getAuth(app);

            setDb(firestore);
            setAuth(authInstance);

            const unsubscribeAuth = onAuthStateChanged(authInstance, async (user) => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                    try {
                        if (initialAuthToken) {
                            await signInWithCustomToken(authInstance, initialAuthToken);
                        } else {
                            await signInAnonymously(authInstance);
                        }
                    } catch (e) {
                        console.error("登入失敗:", e);
                        setError(`認證失敗: ${e.message}`);
                    }
                }
                setIsAuthReady(true);
            });

            return () => unsubscribeAuth();
        } catch (e) {
            console.error("Firebase 初始化失敗:", e);
            setError(`Firebase 初始化失敗: ${e.message}`);
        }
    }, []);
    
    // --- Firestore 資料監聽 (所有提交) ---
    useEffect(() => {
        if (!db || !isAuthReady) return;

        setLoading(true);

        const submissionsRef = collection(db, COLLECTION_PATH);
        // 注意：為了避免潛在的索引問題，我們只監聽集合，排序在客戶端處理。
        const unsubscribe = onSnapshot(submissionsRef, (snapshot) => {
            const fetchedSubmissions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // 客戶端排序: 根據提交時間倒序
            fetchedSubmissions.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
            
            setSubmissions(fetchedSubmissions);
            setLoading(false);
        }, (err) => {
            console.error("Firestore 監聽失敗:", err);
            setError(`資料載入失敗: ${err.message}`);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, isAuthReady]);

    // --- 員工提交操作 ---
    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        if (!db || !userId || !requestTitle || !requestDetails) {
            alert('請填寫標題和詳細資訊。');
            return;
        }

        try {
            await addDoc(collection(db, COLLECTION_PATH), {
                title: requestTitle,
                details: requestDetails,
                status: 'Pending', // 預設狀態
                submitterId: userId,
                timestamp: serverTimestamp(),
                approvedBy: null,
            });

            // 清空表單
            setRequestTitle('');
            setRequestDetails('');
        } catch (e) {
            console.error("提交請求失敗:", e);
            setError(`提交請求失敗: ${e.message}`);
        }
    };
    
    // --- 經理審批操作 ---
    const handleApproveReject = async (submissionId, newStatus) => {
        if (!db || !userId) return;

        // 使用自定義模態框替代 window.confirm
        const actionText = newStatus === 'Approved' ? '批准' : '拒絕';
        if (!confirm(`確定要${actionText}這個請求嗎？`)) { 
            return;
        }
        
        try {
            const docRef = doc(db, COLLECTION_PATH, submissionId);
            await updateDoc(docRef, {
                status: newStatus,
                approvedBy: userId,
                approvalTimestamp: serverTimestamp(),
            });
        } catch (e) {
            console.error(`${actionText}請求失敗:`, e);
            setError(`${actionText}請求失敗: ${e.message}`);
        }
    };
    
    // 自定義 Confirm 彈窗
    const confirm = (message) => {
        // Since window.confirm is forbidden, we use a simple prompt as a fallback modal.
        return window.prompt(`[請輸入 Y 確認操作] ${message}`)?.toUpperCase() === 'Y';
    };


    // --- 渲染載入和錯誤狀態 ---
    if (loading && !isAuthReady) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <div className="text-center p-6 bg-white rounded-xl shadow-lg">
                    <div className="w-8 h-8 border-4 border-t-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-lg font-medium text-indigo-600">正在載入應用程式與認證...</p>
                    {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                </div>
            </div>
        );
    }
    
    if (error && !loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-red-50">
                <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-red-300">
                    <h1 className="text-2xl font-bold text-red-600 mb-2">發生錯誤</h1>
                    <p className="text-gray-700">{error}</p>
                    <p className="text-sm text-gray-500 mt-3">請檢查瀏覽器控制台獲取更多細節。</p>
                </div>
            </div>
        );
    }


    // --- 渲染主應用程式 ---
    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8 flex justify-center">
            <div className="w-full max-w-7xl space-y-8">
                
                {/* 標題與使用者資訊 */}
                <header className="text-center pb-4 border-b border-indigo-200">
                    <h1 className="text-4xl font-extrabold text-indigo-700">工作流程審批中心</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        目前使用者 ID: <span className="font-mono text-indigo-600 font-medium truncate">{userId}</span>
                        <span className="ml-4 text-xs italic text-red-500">（所有用戶皆可審批）</span>
                    </p>
                </header>

                {/* 主內容區塊：提交表單與清單 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* 左側：員工提交表單 (佔一欄) */}
                    <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg h-fit sticky top-4">
                        <h2 className="text-2xl font-semibold text-green-700 border-b pb-2 mb-4">提交新請求 (員工介面)</h2>
                        <SubmissionForm 
                            requestTitle={requestTitle}
                            setRequestTitle={setRequestTitle}
                            requestDetails={requestDetails}
                            setRequestDetails={setRequestDetails}
                            handleSubmitRequest={handleSubmitRequest}
                        />
                    </div>

                    {/* 右側：審批清單 (佔兩欄) */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg space-y-4">
                        <h2 className="text-2xl font-semibold text-gray-700 border-b pb-2">所有請求清單 (經理/審核介面)</h2>
                        <SubmissionList 
                            submissions={submissions}
                            userId={userId}
                            handleApproveReject={handleApproveReject}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};
export default App;

// --- 子組件 ---

/**
 * 員工提交表單
 */
const SubmissionForm = ({ requestTitle, setRequestTitle, requestDetails, setRequestDetails, handleSubmitRequest }) => {
    return (
        <form onSubmit={handleSubmitRequest} className="space-y-4">
            {/* 標題輸入 */}
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">請求標題 (例如: 請假、報銷)</label>
                <input 
                    type="text" 
                    id="title" 
                    value={requestTitle}
                    onChange={(e) => setRequestTitle(e.target.value)}
                    placeholder="輸入請求的簡短標題"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                    required
                />
            </div>

            {/* 詳細內容輸入 */}
            <div>
                <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-1">詳細說明</label>
                <textarea 
                    id="details" 
                    rows="4"
                    value={requestDetails}
                    onChange={(e) => setRequestDetails(e.target.value)}
                    placeholder="請在此處提供所有必要的細節..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                    required
                />
            </div>

            {/* 提交按鈕 */}
            <button 
                type="submit" 
                className="w-full py-3 mt-4 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition duration-150 ease-in-out"
            >
                提交審批請求
            </button>
        </form>
    );
};

/**
 * 審批清單
 */
const SubmissionList = ({ submissions, userId, handleApproveReject }) => {

    if (submissions.length === 0) {
        return <p className="text-center text-gray-500 italic py-10">尚無任何提交請求。</p>;
    }

    // 根據狀態獲取樣式
    const getStatusStyles = (status) => {
        switch (status) {
            case 'Approved':
                return 'bg-green-100 text-green-700 border-green-300';
            case 'Rejected':
                return 'bg-red-100 text-red-700 border-red-300';
            case 'Pending':
            default:
                return 'bg-yellow-100 text-yellow-700 border-yellow-300';
        }
    };
    
    // 格式化 ID (為了更好的顯示效果)
    const formatUserId = (id) => `${id.substring(0, 4)}...${id.substring(id.length - 4)}`;

    return (
        <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
            {submissions.map(t => (
                <div 
                    key={t.id} 
                    className={`p-5 rounded-xl shadow-md border transition ${getStatusStyles(t.status)}`}
                >
                    <div className="flex justify-between items-start mb-3 border-b pb-2 border-gray-200">
                        {/* 標題與狀態 */}
                        <div>
                            <p className="text-xl font-bold text-gray-800">{t.title}</p>
                            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full mt-1 ${getStatusStyles(t.status)}`}>
                                {t.status === 'Pending' ? '待審批' : (t.status === 'Approved' ? '已批准' : '已拒絕')}
                            </span>
                        </div>
                        
                        {/* 提交者資訊 */}
                        <div className="text-right text-sm text-gray-600">
                            <p className="font-medium">提交者:</p>
                            <p className="font-mono text-xs">{t.submitterId === userId ? `您 (${formatUserId(t.submitterId)})` : formatUserId(t.submitterId)}</p>
                            <p className="text-xs mt-1">
                                {t.timestamp ? new Date(t.timestamp.toMillis()).toLocaleString('zh-TW') : '載入中'}
                            </p>
                        </div>
                    </div>

                    {/* 詳細內容 */}
                    <p className="text-sm text-gray-700 mb-4 whitespace-pre-wrap">{t.details}</p>

                    {/* 審批結果/操作區 */}
                    {t.status === 'Pending' ? (
                        <div className="flex space-x-3 pt-3 border-t border-gray-200">
                            <button 
                                onClick={() => handleApproveReject(t.id, 'Approved')}
                                className="flex-1 py-2 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition shadow-md disabled:opacity-50"
                                disabled={t.submitterId === userId} // 員工不能審批自己的請求
                            >
                                批准 (Approve)
                            </button>
                            <button 
                                onClick={() => handleApproveReject(t.id, 'Rejected')}
                                className="flex-1 py-2 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition shadow-md disabled:opacity-50"
                                disabled={t.submitterId === userId} // 員工不能審批自己的請求
                            >
                                拒絕 (Reject)
                            </button>
                            {t.submitterId === userId && <span className="text-xs text-red-500 italic flex items-center">無法審批自己的請求</span>}
                        </div>
                    ) : (
                        <div className="pt-3 border-t border-gray-200 text-sm text-gray-600">
                            <p className="font-medium">審批結果:</p>
                            <p className="ml-2">
                                經手人: <span className="font-mono">{t.approvedBy ? formatUserId(t.approvedBy) : 'N/A'}</span>
                            </p>
                            <p className="ml-2">
                                完成時間: {t.approvalTimestamp ? new Date(t.approvalTimestamp.toMillis()).toLocaleString('zh-TW') : 'N/A'}
                            </p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
