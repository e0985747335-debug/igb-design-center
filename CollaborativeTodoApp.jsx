import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    onAuthStateChanged 
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    query, 
    onSnapshot, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc,
    serverTimestamp,
    setLogLevel 
} from 'firebase/firestore';

// 啟用 Firestore 偵錯日誌，方便除錯
setLogLevel('Debug');

// 全域變數定義 (來自 Canvas 環境)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
// 修正後的變數名稱
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// 定義 Todo 介面
/**
 * @typedef {Object} Todo
 * @property {string} id - 文件 ID
 * @property {string} text - 待辦事項文字
 * @property {boolean} completed - 是否完成
 * @property {string} authorId - 建立者 ID
 * @property {import('firebase/firestore').Timestamp} createdAt - 建立時間
 */

const TodoItem = React.memo(({ todo, toggleTodo, deleteTodo, currentUserId }) => {
    // 檢查是否為當前使用者建立的項目
    const isOwner = todo.authorId === currentUserId;

    return (
        <div className="flex items-center justify-between p-4 bg-white shadow-md rounded-lg mb-3 transition duration-300 hover:shadow-lg">
            <div className="flex items-center flex-1 min-w-0" onClick={() => toggleTodo(todo.id, todo.completed)}>
                <input
                    type="checkbox"
                    checked={todo.completed}
                    readOnly
                    className="w-5 h-5 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 mr-4 cursor-pointer flex-shrink-0"
                />
                <span className={`text-gray-800 break-words flex-1 ${todo.completed ? 'line-through text-gray-400 italic' : 'font-medium'}`}>
                    {todo.text}
                </span>
            </div>
            
            <div className="flex items-center ml-4 flex-shrink-0">
                {/* 顯示作者ID的前幾碼 */}
                <span className="text-xs text-indigo-500 mr-3 hidden sm:inline">
                    {isOwner ? '你' : `協作者: ${todo.authorId.substring(0, 4)}...`}
                </span>
                
                <button
                    onClick={(e) => { e.stopPropagation(); deleteTodo(todo.id); }}
                    aria-label="Delete Todo"
                    className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition duration-150"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 100 2v6a1 1 0 100-2V8z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
});


function App() {
    /** @type {[Todo[], React.Dispatch<React.SetStateAction<Todo[]>>]} */
    const [todos, setTodos] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState('');

    // 1. Firebase 初始化與身份驗證
    useEffect(() => {
        try {
            // 避免重複初始化
            const app = window.firebaseApp || initializeApp(firebaseConfig);
            if (!window.firebaseApp) window.firebaseApp = app;

            const authInstance = getAuth(app);
            const dbInstance = getFirestore(app);

            const authenticate = async () => {
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(authInstance, initialAuthToken);
                    } else {
                        await signInAnonymously(authInstance);
                    }
                } catch (e) {
                    console.error("Authentication failed:", e);
                }
            };
            
            // 執行身份驗證
            authenticate(); 

            // 設置身份驗證狀態監聽器
            const unsubscribeAuth = onAuthStateChanged(authInstance, (user) => {
                const currentId = user ? user.uid : (typeof crypto !== 'undefined' ? crypto.randomUUID() : 'anonymous');
                setUserId(currentId);
                setAuth(authInstance);
                setDb(dbInstance);
                setIsLoading(false); // 身份驗證完成後停止加載
            });

            return () => unsubscribeAuth();

        } catch (e) {
            console.error("Firebase setup failed:", e);
            setIsLoading(false);
        }
    }, []);

    // 2. 獲取並監聽 Firestore 待辦事項 (在 db 和 userId 準備就緒後)
    useEffect(() => {
        if (!db || !userId) return; // 確保 db 和 userId 已經設置

        // 使用公共路徑進行協作
        const collectionPath = `/artifacts/${appId}/public/data/todos_collection`;
        const q = query(collection(db, collectionPath));

        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
            const todosData = snapshot.docs.map(doc => {
                // 將 Firestore 資料轉換為 Todo 類型
                const data = doc.data();
                return {
                    id: doc.id,
                    text: data.text || '無內容',
                    completed: data.completed || false,
                    authorId: data.authorId || 'unknown',
                    createdAt: data.createdAt, // 保持為 Timestamp 類型或 null
                };
            }).sort((a, b) => 
                (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0) // 依創建時間排序
            );
            setTodos(todosData);
        }, (error) => {
            console.error("Error listening to Firestore:", error);
        });

        return () => unsubscribeSnapshot(); // 清理監聽器
    }, [db, userId]);

    // 3. CRUD 操作
    const addTodo = useCallback(async (e) => {
        e.preventDefault();
        if (!input.trim() || !db || !userId) return;

        const collectionPath = `/artifacts/${appId}/public/data/todos_collection`;
        try {
            await addDoc(collection(db, collectionPath), {
                text: input.trim(),
                completed: false,
                authorId: userId,
                createdAt: serverTimestamp(), // 使用 Firestore 伺服器時間戳
            });
            setInput('');
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    }, [input, db, userId]);

    const toggleTodo = useCallback(async (id, currentCompleted) => {
        if (!db) return;
        const docPath = `/artifacts/${appId}/public/data/todos_collection/${id}`;
        try {
            await updateDoc(doc(db, docPath), {
                completed: !currentCompleted
            });
        } catch (e) {
            console.error("Error updating document: ", e);
        }
    }, [db, appId]);

    const deleteTodo = useCallback(async (id) => {
        if (!db) return;
        const docPath = `/artifacts/${appId}/public/data/todos_collection/${id}`;
        try {
            await deleteDoc(doc(db, docPath));
        } catch (e) {
            console.error("Error deleting document: ", e);
        }
    }, [db, appId]);


    // 4. 渲染邏輯
    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                <p className="ml-3 text-indigo-600 font-medium">載入中...</p>
            </div>
        );
    }
    
    // 計算完成和未完成的數量
    const pendingTodos = todos.filter(todo => !todo.completed);
    const completedTodos = todos.filter(todo => todo.completed);

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans">
            <div className="max-w-xl mx-auto bg-white rounded-xl shadow-2xl p-6 sm:p-8">
                <header className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-indigo-700 text-center">
                        協作待辦清單 (Todo App)
                    </h1>
                    <p className="text-center text-sm text-gray-500 mt-2">
                        您的使用者 ID: <span className="font-mono text-xs bg-gray-200 px-2 py-0.5 rounded-md">{userId}</span>
                        <br/>
                        所有登入的使用者將看到並編輯相同的清單！
                    </p>
                </header>

                {/* 新增待辦事項表單 */}
                <form onSubmit={addTodo} className="flex space-x-3 mb-8">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="新增一個協作待辦事項..."
                        aria-label="New todo text"
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                        disabled={!db}
                    />
                    <button
                        type="submit"
                        disabled={!db || !input.trim()}
                        className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 disabled:bg-indigo-300"
                    >
                        新增
                    </button>
                </form>

                {/* 待辦事項清單 - 待處理 */}
                <h2 className="text-xl font-bold text-gray-700 mb-4 flex justify-between items-center">
                    待處理事項
                    <span className="text-sm font-medium text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">{pendingTodos.length}</span>
                </h2>
                <div className="space-y-3 mb-8">
                    {pendingTodos.length === 0 ? (
                        <p className="text-gray-500 text-center italic p-4 bg-gray-50 rounded-lg">太棒了！沒有待處理事項。</p>
                    ) : (
                        pendingTodos.map(todo => (
                            <TodoItem 
                                key={todo.id} 
                                todo={todo} 
                                toggleTodo={toggleTodo} 
                                deleteTodo={deleteTodo} 
                                currentUserId={userId}
                            />
                        ))
                    )}
                </div>

                {/* 待辦事項清單 - 已完成 */}
                <h2 className="text-xl font-bold text-gray-700 mb-4 flex justify-between items-center border-t pt-6">
                    已完成事項
                    <span className="text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">{completedTodos.length}</span>
                </h2>
                <div className="space-y-3">
                    {completedTodos.length === 0 ? (
                        <p className="text-gray-500 text-center italic p-4 bg-gray-50 rounded-lg">還沒有完成的項目。</p>
                    ) : (
                        completedTodos.map(todo => (
                            <TodoItem 
                                key={todo.id} 
                                todo={todo} 
                                toggleTodo={toggleTodo} 
                                deleteTodo={deleteTodo} 
                                currentUserId={userId}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
