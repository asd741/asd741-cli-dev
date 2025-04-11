# 腳手架命令動態加載功能架構設計
架構設計圖如下：

flowchart TD
    start((start)) --> A{是否执行本地代码}
    A -->|N| B[获取缓存目录]
    B --> C[初始化Package对象]
    C --> D{Package是否存在}
    D -->|Y| E[更新Package]
    D -->|N| F[安装Package]
    F --> G[获取本地代码入口文件]
    E --> G
    A -->|Y| G
    G --> H{入口文件是否存在}
    H -->|Y| I[生成指令执行代码]
    I --> J[启动新进程执行代码]
    J --> K{执行产生异常}
    K -->|N| L[执行完毕正常退出]
    K -->|Y| M[终止执行打印异常]
    H -->|N| N[终止执行]
    N --> endPoint((end))
    L --> endPoint
    M --> endPoint