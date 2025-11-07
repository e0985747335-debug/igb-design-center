import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc,
  getDocs,
  setLogLevel
} from 'firebase/firestore';
import { Trash2, Plus, Loader2, RefreshCw } from 'lucide-react';

// 設定 Firebase 服務的日誌級別為 Debug
setLogLevel('Debug');

// 初始化 Firebase 相關的全局變數
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
// 不再使用 initialAuthToken，完全依賴匿名登入

// 初始化應用程式
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 主應用程式組件
const App = () => {
  const [notes, setNotes] = useState([]); 
  const [title, setTitle] = useState(''); 
  const [content, setContent] = useState(''); 
  const [userId, setUserId] = useState(null); 
  const [loading, setLoading] = useState(true); 
  const [firebaseError, setFirebaseError] = useState(null); 

  // 1. 處理 Firebase 認證和初始化：只使用最穩定的匿名登入
  useEffect(() => {
    const authenticate = async () => {
      try {
        await signInAnonymously(auth); // 嘗試匿名登入
      } catch (error) {
        console.error('Firebase 認證失敗:', error);
        // 顯示 Firebase 錯誤代碼和訊息
        setFirebaseError(`認證失敗 (代碼: ${error.code}): ${error.message}`); 
        setLoading(false); // 立即停止載入
      }
    };

    // 設置認證狀態監聽器
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // 成功取得用戶 ID
        setUserId(user.uid);
        setFirebaseError(null); 
        setLoading(false);
      } else if (!userId && !firebaseError) {
        // 尚未登入且無錯誤，執行認證
        authenticate();
      } else if (!firebaseError) {
        // 如果沒有 user 且沒有錯誤訊息，確保載入結束
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 構建 Firestore 集合路徑
  const getCollectionPath = useCallback(() => {
    if (!userId) return null;
    // 私人資料路徑: /artifacts/{appId}/users/{userId}/notes
    return `artifacts/${appId}/users/${userId}/notes`;
  }, [userId]);

  // 2. 即時監聽 Firestore 資料變化
  useEffect(() => {
    const path = getCollectionPath();
    
    // 如果認證失敗或用戶 ID 尚未準備好，不進行監聽
    if (!db || !path || loading) { 
      setNotes([]); 
      return; 
    }

    const notesCollection = collection(db, path);
    const q = query(notesCollection);

    // 設置即時監聽器
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // 依建立時間排序
      notesData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); 
      setNotes(notesData);
      setFirebaseError(null); 
    }, (error) => {
      console.error("Firestore 即時監聽失敗: ", error);
      setFirebaseError(`資料連線失敗: ${error.message}. (請檢查權限)`); 
      setNotes([]); 
    });

    return () => unsubscribe();
  }, [getCollectionPath, loading]); // 依賴 loading 確保認證完成後才開始監聽

  // 處理新增備忘錄
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !userId) return;
    
    if (firebaseError && firebaseError.includes('認證失敗')) {
        alert('無法新增：認證或連線失敗。請重新整理。');
        return;
    }

    try {
      const path = getCollectionPath();
      if (!path) return;

      await addDoc(collection(db, path), {
        title: title.trim(),
        content: content.trim(),
        createdAt: Date.now(),
        userId: userId,
      });

      setTitle('');
      setContent('');
      setFirebaseError(null); 
    } catch (e) {
      console.error("新增備忘錄失敗: ", e);
      alert(`新增備忘錄失敗: ${e.message}. (請檢查寫入權限)`); 
    }
  };

  // 處理刪除備忘錄
  const handleDeleteNote = async (id) => {
    if (!userId) return;
    try {
      const path = getCollectionPath();
      if (!path) return;
      
      const noteRef = doc(db, path, id);
      await deleteDoc(noteRef);
    } catch (e) {
      console.error("刪除備忘錄失敗: ", e);
      alert(`刪除備忘錄失敗: ${e.message}. (請檢查刪除權限)`);
    }
  };

  // 處理清空所有備忘錄
  const handleClearAllNotes = async () => {
    if (!userId) return;

    const isConfirmed = await customConfirm('確定要清除所有備忘錄嗎？此操作無法撤銷。');
    if (!isConfirmed) return;

    setLoading(true);
    try {
      const path = getCollectionPath();
      if (!path) return;

      const q = query(collection(db, path));
      const snapshot = await getDocs(q);
      
      let deletePromises = [];
      snapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });
      
      await Promise.all(deletePromises);
      alert('已成功清除所有備忘錄！');
      setFirebaseError(null);
    } catch (e) {
      console.error("清除所有備忘錄失敗: ", e);
      alert(`清除所有備忘錄失敗: ${e.message}.`);
    } finally {
      setLoading(false);
    }
  };

  // 錯誤訊息組件
  const ErrorMessage = firebaseError && (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-6 shadow-md" role="alert">
      <strong className="font-bold">連線錯誤: </strong>
      <span className="block sm:inline">{firebaseError}</span>
      <p className="text-sm mt-1">如果錯誤代碼是 `auth/...`，請嘗試重新整理。如果是 `permission-denied`，請檢查控制台的錯誤日誌。</p>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen font-sans">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        .font-sans {
          font-family: 'Inter', sans-serif;
        }
      `}</style>

      {/* 標題與使用者資訊 */}
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-indigo-700 mb-2 border-b pb-2">雲端即時備忘錄</h1>
        {ErrorMessage} {/* 顯示錯誤訊息 */}
        <div className="flex justify-between items-center flex-wrap">
            <p className="text-sm text-gray-500 truncate mb-2 sm:mb-0">
            使用者 ID (您的私人儲存空間): <span className="font-mono text-xs text-indigo-600 bg-indigo-50 p-1 rounded break-all">{userId || '連線錯誤'}</span>
            </p>
            <button
                onClick={handleClearAllNotes}
                className="flex items-center text-sm text-red-600 hover:text-red-800 transition duration-150 ease-in-out px-3 py-1 border border-red-400 rounded-full hover:bg-red-50 disabled:opacity-50"
                disabled={notes.length === 0 || !userId || loading}
            >
                <RefreshCw className="w-4 h-4 mr-1" /> 清空所有備忘錄
            </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 新增備忘錄表單 */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg h-fit sticky top-4">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
            <Plus className="mr-2 h-5 w-5 text-indigo-500" />新增備忘錄
          </h2>
          <form onSubmit={handleAddNote} className="space-y-4">
            <input
              type="text"
              placeholder="備忘錄標題"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              maxLength={100}
              required
            />
            <textarea
              placeholder="輸入備忘錄內容..."
              rows="6"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out resize-none"
              required
            ></textarea>
            <button
              type="submit"
              className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg shadow-md transition duration-200 ease-in-out disabled:bg-indigo-300"
              disabled={!title.trim() || !content.trim() || !userId}
            >
              <Plus className="h-5 w-5 mr-1" />
              儲存備忘錄
            </button>
          </form>
        </div>

        {/* 備忘錄列表 */}
        <div className="lg:col-span-2 space-y-4">
          {notes.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow-lg text-center text-gray-500">
              <p className="text-lg font-medium">目前沒有備忘錄。</p>
              <p className="text-sm">使用左側表單新增第一則備忘錄。</p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="bg-white p-5 rounded-xl shadow-lg hover:shadow-xl transition duration-300 ease-in-out border-l-4 border-indigo-400 flex justify-between items-start"
              >
                <div className="flex-grow pr-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{note.title}</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    建立於: {new Date(note.createdAt).toLocaleString('zh-TW')}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="p-2 text-red-500 hover:text-red-700 bg-red-100 rounded-full transition duration-150 ease-in-out flex-shrink-0"
                  aria-label="刪除備忘錄"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

       {/* 提示訊息容器 (Alerts 和 Confirms 的顯示位置) */}
       <div id="message-box" className="fixed bottom-4 right-4 z-50"></div>
       <div id="confirm-modal" className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 hidden flex items-center justify-center"></div>
    </div>
  );
};

export default App;

// ======== 自定義 UI 函數取代原生 Alert 和 Confirm ========

// 自定義 Alert 函數 (取代 alert())
const alert = (message) => {
    const box = document.getElementById('message-box');
    if (!box) return;

    const alertDiv = document.createElement('div');
    alertDiv.className = 'bg-red-500 text-white p-3 rounded-lg shadow-xl mb-2 text-sm max-w-xs';
    alertDiv.textContent = message;
    
    box.prepend(alertDiv);
    
    // 3秒後自動消失
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
};

// 自定義 Confirm 函數 (取代 window.confirm())
const customConfirm = (message) => {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        if (!modal) {
             // 如果找不到 modal 容器，則直接返回 false
            return resolve(false);
        }

        modal.classList.remove('hidden');
        modal.innerHTML = `
            <div class="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full">
                <p class="text-lg font-semibold text-gray-800 mb-6">${message}</p>
                <div class="flex justify-end space-x-3">
                    <button id="confirm-cancel" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-150">取消</button>
                    <button id="confirm-ok" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-150">確定清除</button>
                </div>
            </div>
        `;

        const cleanup = (value) => {
            modal.classList.add('hidden');
            modal.innerHTML = '';
            resolve(value);
        };

        // 確保點擊背景也可以關閉（視為取消）
        modal.onclick = (e) => {
            if (e.target === modal) {
                cleanup(false);
            }
        };

        document.getElementById('confirm-cancel').onclick = () => cleanup(false);
        document.getElementById('confirm-ok').onclick = () => cleanup(true);
    });
};

