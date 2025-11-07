import React, { useState, useEffect, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// -----------------------------------------------------------
// 1. 定義 Firebase Context
// -----------------------------------------------------------
const FirebaseContext = createContext({
  db: null,
  auth: null,
  userId: null,
  isAuthReady: false,
});

export const useFirebase = () => useContext(FirebaseContext);

// -----------------------------------------------------------
// 2. Firebase 初始化和認證邏輯
// -----------------------------------------------------------
// 移除 'export const'，準備將其設定為預設匯出
const FirebaseProvider = ({ children }) => {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // 獲取全域變數，這是 Canvas 環境自動提供的
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const firebaseConfig = typeof __firebase_config !== 'undefined' 
      ? JSON.parse(__firebase_config) 
      : null;
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' 
      ? __initial_auth_token 
      : null;

    if (!firebaseConfig) {
      console.error("錯誤：未找到 __firebase_config。請檢查環境變數。");
      return;
    }

    try {
      // 1. 初始化 Firebase 應用程式
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const authInstance = getAuth(app);

      setDb(firestore);
      setAuth(authInstance);

      // 2. 處理認證
      const authenticate = async () => {
        try {
          if (initialAuthToken) {
            // 使用提供的 Custom Token 登入 (優先)
            await signInWithCustomToken(authInstance, initialAuthToken);
            console.log("Firebase: 使用 Custom Token 登入成功。");
          } else {
            // 如果沒有 Token，則匿名登入
            await signInAnonymously(authInstance);
            console.log("Firebase: 匿名登入成功。");
          }
        } catch (error) {
          console.error("Firebase 登入失敗：", error);
        }
      };

      // 3. 設定 Auth 狀態監聽器
      // onAuthStateChanged 會在登入操作完成後觸發
      const unsubscribe = onAuthStateChanged(authInstance, (user) => {
        if (user) {
          setUserId(user.uid);
          console.log(`Firebase: 用戶已認證，UID: ${user.uid}`);
        } else {
          // 如果沒有用戶，但 Auth 流程已運行完畢，我們仍然認為 Auth 是 ready 的
          const newUserId = `anonymous-${crypto.randomUUID()}`;
          setUserId(newUserId); // 使用隨機 ID 作為匿名用戶標識符
          console.log(`Firebase: 未認證用戶，使用隨機 ID: ${newUserId}`);
        }
        // 無論成功與否，認證流程（onAuthStateChanged 的初始回調）完成後，設置 ready 狀態
        setIsAuthReady(true);
      });

      // 啟動認證流程
      authenticate();

      // 清理函數：在組件卸載時取消監聽
      return () => unsubscribe();

    } catch (e) {
      console.error("Firebase 初始化失敗：", e);
    }

  }, []); // 只在組件初次掛載時運行一次

  // 傳遞給 Provider 的值
  const contextValue = { db, auth, userId, isAuthReady };

  return (
    <FirebaseContext.Provider value={contextValue}>
      {/* 只有在認證就緒後才渲染子組件，防止在認證完成前嘗試讀取資料 */}
      {isAuthReady ? children : (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-700">
          正在載入應用程式資料...
        </div>
      )}
    </FirebaseContext.Provider>
  );
};

export default FirebaseProvider; // <--- 新增：將 FirebaseProvider 設為預設匯出

