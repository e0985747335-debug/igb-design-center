# 使用官方 Python 3.11 基礎映像
FROM python:3.11-slim

# 設定工作目錄
WORKDIR /app

# 複製專案進入容器
COPY . /app

# 安裝必要套件
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn[standard] \
    sqlalchemy \
    psycopg2-binary \
    python-dotenv

# 暴露 FastAPI 埠號
EXPOSE 8000

# 啟動 FastAPI（指定 app 資料夾下的 main.py）
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
