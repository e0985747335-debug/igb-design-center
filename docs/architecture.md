# 🏗 e菜市 系統架構圖

以下為 e菜市 平台的高階系統架構概覽：

```mermaid
graph TD
    subgraph Users["使用者端 (User-facing)"]
        A1["👩‍🌾 消費者 App/Web"]
        A2["🏪 攤商後台 Web"]
    end

    subgraph Backend["後端應用層 (API Server)"]
        B1["Next.js (App Router)"]
        B2["Node.js API (Express / NestJS)"]
        B3["身份驗證服務 (Auth)"]
    end

    subgraph Database["資料與儲存"]
        C1["PostgreSQL / MySQL"]
        C2["Redis 快取"]
        C3["S3 物件儲存 (圖片/檔案)"]
    end

    subgraph Integrations["外部整合系統"]
        D1["💳 金流服務 (ECPay / Line Pay)"]
        D2["🚚 物流服務 (黑貓 / 宅配通)"]
        D3["🔔 通知服務 (Line Notify / Email)"]
    end

    subgraph Admin["平台管理後台"]
        E1["📊 管理後台 Dashboard"]
        E2["🔐 權限與營運設定"]
    end

    %% Connections
    A1 -->|HTTP / GraphQL| B1
    A2 -->|HTTP / REST| B2
    B1 -->|Auth / Data| B3
    B1 -->|Query / Store| C1
    B2 -->|Cache / Session| C2
    B1 -->|Media Upload| C3
    B2 -->|Payment / Logistics| D1
    B2 --> D2
    B1 --> D3
    E1 --> B2
    E1 --> C1

