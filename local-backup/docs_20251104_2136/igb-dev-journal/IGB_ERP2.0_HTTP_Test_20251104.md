
cat > docs/igb-dev-journal/IGB_ERP2.0_HTTP_Test_20251104.md <<'EOF'
# IGB ERP 2.0 - HTTP 測試階段紀錄（2025-11-04）

## 📦 系統狀態
- 模式：HTTP 測試模式（自動 HTTPS 關閉）
- 網址：http://igb47.eu.org
- FastAPI Container：`igb_fastapi`（port 8000）
- Caddy Container：`igb_caddy`（port 80）
- PostgreSQL：`igb_postgres`（port 5433）
- pgAdmin：`igb_pgadmin`（/pgadmin）

## 🧠 API 狀態
- `/api/openapi.json` ✅ 可回傳 (OpenAPI 3.0.3)
- Swagger UI 顯示問題：Content-Type 為 `text/plain` 時無法渲染
- 已確認 FastAPI 正常服務，問題集中於 Caddy Proxy Header

## ⚙️ Caddyfile (HTTP 測試版)
```caddyfile
:80 {
    handle /api/* {
        uri strip_prefix /api
        reverse_proxy igb_fastapi:8000 {
            header_up Accept application/json
            header_up Content-Type application/json
        }
    }

    handle_path /pgadmin/* {
        reverse_proxy igb_pgadmin:80
    }

    handle {
        respond "IGB ERP 2.0 戰略指揮中心 (HTTP 測試模式)" 200
    }

    log {
        output file /var/log/caddy/access.log
        format console
    }
}

🧰 TODO

 驗證 Content-Type 是否經由 Caddy 正確轉送

 準備回復 HTTPS 模式後自動簽發 TLS

 加入 FastAPI /api/docs Swagger 測試頁
EOF

