graph TD
    %% 樣式定義
    classDef mainNode fill:#bbf7d0,stroke:#16a34a,stroke-width:2px;
    classDef phaseNode fill:#dbeafe,stroke:#3b82f6;
    classDef decisionNode fill:#fef9c3,stroke:#eab308;
    classDef docProcess fill:#ffffff,stroke:#94a3b8;
    classDef reviewNode fill:#fbcfe8,stroke:#ec4899;

    A[專案啟動 / 文件撰寫授權]::mainNode --> B;

    subgraph 階段一：需求確認與基礎規劃
        B(收集與分析業務/系統需求):::phaseNode --> C{所有需求是否清晰且已批准?};
        C -- 否 --> B;
        C -- 是 --> D[輸出：功能/非功能需求文檔];
    end

    D --> E;

    subgraph 階段二：核心技術規格書起草 (DRAFT)
        E(設計階段啟動):::phaseNode --> F;
        F[撰寫系統架構設計 (微服務/單體/雲端)]:<bos>;
        F --> G[定義關鍵模組與介面 (API/資料交換)];
        G --> H[設計核心資料模型與實體關聯圖 (ERD)];
        H --> I[制定安全、性能與部署規範];
        I --> J[整合所有內容並形成規格書 V0.9 DRAFT]::docProcess;
    end

    J --> K;

    subgraph 階段三：審查與驗證
        K(發佈 V0.9 供內部技術審查):::reviewNode --> L{審查意見是否通過?};
        L -- 否/需修改 --> M[根據意見進行修改與調整 (迭代)]:docProcess;
        M --> J; % 回到草稿階段，更新版本
        L -- 是/通過 --> N[發佈 V1.0 PREVIEW 供利害關係人審查];
        N --> O{業務/專案團隊是否批准規格? (Sign-off)}:::decisionNode;
    end

    O -- 否/拒絕 --> M; % 需進行重大修改，回到草稿階段
    O -- 是/批准 --> P;

    subgraph 階段四：文件定稿與交付
        P(規格書文件批准):::phaseNode --> Q[建立最終版本 V1.0 (基線)];
        Q --> R[文件版本控制與存儲 (Git/文件管理系統)];
        R --> S[向開發/測試團隊發布並交付文件]::mainNode;
    end

    S --> Z(IGB ERP 2.0 開發階段正式啟動)::mainNode;
