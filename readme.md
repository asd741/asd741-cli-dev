腳手架整理流程圖如下。至於"動態加載initCommand"這個步驟的流程圖，可以看execCommand.md。

flowchart TD
    start((start)) --> A[imooc-cli-dev init]
    A --> B[腳手架啟動階段]
    B -.-> C[檢查版本號]
    B --> D[commander腳手架初始化]
    
    C --> E[檢查root啟動]
    E --> F[檢查用戶主目錄]
    F --> G[檢查環境變量]
    G --> H[檢查cli最新版本]
    
    D --> I[動態加載initCommand]
    I --> J[new InitCommand]
    J --> K[Command constructor]
    K --> L[命令的準備階段]
    L -.-> M[檢查node版本]
    M --> N[參數初始化]
    L --> O[命令的執行階段]
    O --> P[init業務邏輯]
    P --> endPoint((end))