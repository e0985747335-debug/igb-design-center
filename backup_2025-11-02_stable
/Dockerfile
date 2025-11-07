# 使用官方 Python 映像
FROM python:3.11-slim

# 工作目錄
WORKDIR /app

# 安裝依賴
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 複製專案
COPY . .

# 暴露 FastAPI 服務的 port
EXPOSE 8000

# 啟動 FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
