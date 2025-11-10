# ==============================================================
# 🚀 IGB ERP 2.1 Modular Secure Mode (v0.2.1-modular)
# Zero Trust + JWT + Modular Frontend Auto Loader + Caddy-ready
# ==============================================================

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from datetime import timedelta
import os, inspect, glob

# === Internal Imports ===
from .auth_utils import create_access_token, verify_token
from .config import ACCESS_TOKEN_EXPIRE_MINUTES, DOMAIN

# === Base Paths ===
BASE_DIR = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")
INDEX_HTML = os.path.join(FRONTEND_DIR, "index.html")
COMPONENTS_DIR = os.path.join(FRONTEND_DIR, "components")
PAGES_DIR = os.path.join(FRONTEND_DIR, "pages")

# === App Initialization ===
app = FastAPI(
    title="IGB ERP 2.1 戰略指揮中心",
    version="0.2.1-modular",
    description="EHSN + JWT + Modular Frontend Auto Loader + HTTPS Ready"
)

# === CORS Settings ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        DOMAIN,
        "http://localhost:9000", "http://127.0.0.1:9000",
        "http://localhost:8088", "http://127.0.0.1:8088",
        "http://localhost:8001", "http://127.0.0.1:8001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Serve Static Files ===
if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="frontend")
else:
    print(f"⚠️ Warning: Frontend directory not found: {FRONTEND_DIR}")

# === Root Route: Always Serve index.html ===
@app.get("/", include_in_schema=False)
async def serve_index():
    """
    讓 FastAPI 直接服務 IGB ERP 前端首頁 index.html。
    """
    if os.path.exists(INDEX_HTML):
        return FileResponse(INDEX_HTML)
    raise HTTPException(status_code=404, detail="index.html not found — please check frontend build path")

# === Auto-discover frontend modules ===
@app.get("/frontend/modules")
async def list_frontend_modules():
    """
    自動掃描前端 components/ 與 pages/，列出所有模組檔案名稱。
    可供前端 JS 動態載入。
    """
    modules = {
        "components": [],
        "pages": []
    }

    if os.path.exists(COMPONENTS_DIR):
        modules["components"] = [
            os.path.basename(f)
            for f in glob.glob(os.path.join(COMPONENTS_DIR, "*.js"))
        ]
    if os.path.exists(PAGES_DIR):
        modules["pages"] = [
            os.path.basename(f)
            for f in glob.glob(os.path.join(PAGES_DIR, "*.js"))
        ]
    return JSONResponse(content=modules)

# === JWT Login Endpoint ===
@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    登入驗證，產生 JWT Token
    """
    if form_data.username != "igb47" or form_data.password != "7aciYMUu":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# === Protected Example API ===
@app.get("/gl/post")
async def simulate_gl_post(username: str = Depends(verify_token)):
    """
    模擬 GL 拋轉測試
    """
    return {"status": "success", "operator": username, "message": "GL posting executed successfully"}

# === Health Check ===
@app.get("/health")
async def health_check():
    """
    系統健康檢查
    """
    return {
        "status": "ok",
        "version": "0.2.1-modular",
        "frontend_dir": FRONTEND_DIR,
        "modules": {
            "components": os.path.exists(COMPONENTS_DIR),
            "pages": os.path.exists(PAGES_DIR)
        }
    }

# === Error Handling Example ===
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": True, "detail": exc.detail, "path": str(request.url)}
    )
