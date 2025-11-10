from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from app.database import Base, engine, get_db
from fastapi.middleware.cors import CORSMiddleware

# --- 初始化 FastAPI ---
app = FastAPI(title="IGB 設計中心 API", version="1.0")

# --- CORS 設定 ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 啟動時自動建立資料庫表格 ---
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

# --- 範例 API ---
@app.get("/api")
def root():
    return {"message": "🚀 IGB FastAPI is running!"}

@app.get("/api/testdb")
def test_db(db: Session = Depends(get_db)):
    try:
        db.execute("SELECT 1")
        return {"db_status": "connected"}
    except Exception as e:
        return {"db_status": "error", "details": str(e)}
