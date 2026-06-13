# dev-tool 功能及架构说明文档

## 1. 项目概述

`dev-tool` 是一款面向开发者的本地桌面工具集，基于 **Tauri + React + TypeScript + Vite** 构建。应用将前端 UI 与 Rust 后端打包为跨平台桌面程序，整合多个日常开发中常用的小工具，包括 Grok 正则解析、时间戳转换、JSON 校验、Prometheus 指标查询以及 LanceDB 数据查看。

## 2. 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 桌面框架 | Tauri v1 | 使用 Web 前端 + Rust 后端构建轻量级桌面应用 |
| 前端框架 | React 18 | 函数组件 + Hooks 开发 |
| 语言 | TypeScript 5 | 静态类型支持 |
| 构建工具 | Vite 5 | 快速开发与生产构建 |
| UI 组件库 | Fluent UI React Components v9 | 微软设计体系的 React 组件 |
| 路由 | react-router-dom v6 | 单页面应用导航 |
| 图表 | ECharts 5 + echarts-for-react | Prometheus 指标折线图展示 |
| 时间处理 | moment.js | 时间格式化与转换 |
| 后端语言 | Rust | Tauri 命令、文件与网络操作 |
| Rust 依赖 | grok、reqwest、tokio、lance、datafusion、arrow、arrow-json | 分别用于正则解析、HTTP 请求、异步运行时、Lance 数据集、SQL 查询、Arrow 数据转换等 |

## 3. 项目目录结构

```
dev-tool/
├── docs/                         # 说明文档
│   └── architecture.md           # 本文档
├── public/                       # 静态资源
├── src/                          # 前端源码
│   ├── App.tsx                   # 应用主组件，导航与路由
│   ├── main.tsx                  # 应用入口
│   ├── assets/                   # 图片等静态资源
│   └── tools/                    # 各功能模块
│       ├── grok/                 # Grok 解析工具
│       ├── time/                 # 时间戳转换工具
│       ├── json/                 # JSON 校验工具
│       ├── metrics/              # Prometheus 指标查询工具
│       └── lance/                # LanceDB 数据查看器
├── src-tauri/                    # Tauri / Rust 后端
│   ├── Cargo.toml                # Rust 依赖配置
│   ├── tauri.conf.json           # Tauri 应用配置
│   ├── icons/                    # 应用图标
│   └── src/
│       ├── main.rs               # 后端入口与 invoke 命令注册
│       ├── metrics.rs            # Prometheus 查询命令
│       └── lance.rs              # LanceDB 数据集操作命令
├── index.html                    # Vite 入口 HTML
├── package.json                  # Node.js 依赖与脚本
├── vite.config.ts                # Vite 配置
└── tsconfig.json                 # TypeScript 配置
```

## 4. 整体架构

应用采用典型的 **Tauri 前后端分离架构**：

- **前端（Renderer Process）**：由 Vite 构建的 React SPA，负责界面渲染、用户交互与状态管理。
- **后端（Main Process）**：Rust 编写的 Tauri 主进程，通过 `tauri::command` 暴露安全能力。
- **进程通信**：前端通过 `@tauri-apps/api` 的 `invoke` 函数调用 Rust 命令，实现跨进程通信（IPC）。
- **能力白名单**：Tauri 的 `tauri.conf.json` 中仅开启 `shell.open` 与 `dialog.open` 能力，遵循最小权限原则。

```
┌─────────────────────────────────────┐
│            前端 (React)              │
│  ┌─────────┐ ┌─────────┐ ┌────────┐ │
│  │  Grok   │ │  Time   │ │  JSON  │ │
│  └─────────┘ └─────────┘ └────────┘ │
│  ┌─────────┐ ┌────────────────────┐ │
│  │ Metrics │ │    Lance Viewer    │ │
│  └─────────┘ └────────────────────┘ │
└──────────────┬──────────────────────┘
               │ invoke / event
┌──────────────▼──────────────────────┐
│         后端 (Tauri + Rust)          │
│  ┌─────────┐ ┌─────────┐ ┌────────┐ │
│  │  grok   │ │ metrics │ │ lance  │ │
│  │ command │ │ command │ │command │ │
│  └─────────┘ └─────────┘ └────────┘ │
└─────────────────────────────────────┘
```

## 5. 功能模块说明

### 5.1 Grok 解析器 (`/grok`)

- **前端**：`src/tools/grok/Grok.tsx`
- **后端**：`src-tauri/src/main.rs`
- **能力**：
  - 输入 Grok 表达式与待匹配文本，提取命名字段。
  - 实时校验 Grok 表达式并显示捕获的字段名（Tag 形式）。
  - 提供内置 Grok Pattern 字典（抽屉展示），支持按名称过滤。
- **Rust 命令**：
  - `extract_fields(expr, text)`：执行匹配并返回字段映射。
  - `validate_grok(expr)`：返回表达式中所有命名捕获组。
  - `default_patterns()`：返回 grok 库内置的所有默认模式。

### 5.2 时间戳转换器 (`/time`)

- **前端**：`src/tools/time/TimeConverter.tsx`
- **后端**：无（纯前端计算）
- **能力**：
  - 显示当前时间与毫秒时间戳（每秒刷新）。
  - 支持秒 / 毫秒 / 微秒 / 纳秒四种单位的时间戳转日期。
  - 支持日期字符串转对应单位的时间戳。

### 5.3 JSON 校验器 (`/json`)

- **前端**：`src/tools/json/JsonValidator.tsx`
- **后端**：无（纯前端计算）
- **能力**：
  - 实时校验输入文本是否为合法 JSON。
  - 校验失败时显示错误信息、行号、列号及错误位置附近的文本。
  - 支持格式化（带缩进）与压缩（单行）。
  - 支持复制格式化后的结果到剪贴板。

### 5.4 Prometheus 指标查询 (`/metrics`)

- **前端**：`src/tools/metrics/Prometheus.tsx`
- **后端**：`src-tauri/src/metrics.rs`
- **能力**：
  - 配置 Prometheus 基础地址与 PromQL 查询语句。
  - 默认查询最近 30 分钟、步长 15 秒的范围数据（`query_range`）。
  - 使用 ECharts 绘制多序列折线图。
- **Rust 命令**：
  - `prometheus_query_range(prom_url, prom_ql, start_time, end_time, step)`：调用 Prometheus HTTP API 并返回 JSON。

### 5.5 LanceDB 数据查看器 (`/lance`)

- **前端**：`src/tools/lance/LanceViewer.tsx`
- **后端**：`src-tauri/src/lance.rs`
- **能力**：
  - 选择本地 Lance 数据集所在目录，自动识别目录下的所有 Lance 表。
  - 展示表结构（Schema）、索引、统计信息。
  - 分页浏览表数据。
  - 支持使用 DataFusion SQL 查询 Lance 表，并分页展示结果。
- **Rust 命令**：
  - `list_lance_tables(directory)`：列出目录下所有可打开的 Lance 表名。
  - `get_table_info(directory, table_name)`：返回表字段、行数、列数。
  - `get_table_data(directory, table_name, page, page_size)`：分页读取表数据。
  - `execute_lance_sql(directory, sql)`：使用 DataFusion 执行 SQL 并返回结果。

## 6. 关键设计说明

### 6.1 路由与导航

`App.tsx` 使用 `react-router-dom` 的 `BrowserRouter` + `Routes` 管理页面切换。左侧导航使用 `NavDrawer`（Fluent UI 预览组件），点击后通过 `useNavigate` 切换路由。

### 6.2 前后端通信

所有需要访问系统资源（文件选择、HTTP 请求、Lance 数据集）的功能均通过 `invoke` 调用 Rust 命令。纯计算类功能（JSON 校验、时间转换）则完全在前端完成，避免不必要的 IPC 开销。

### 6.3 状态管理

项目未引入 Redux 等全局状态库，各组件使用 `useState` 与 `useEffect` 管理本地状态。LanceViewer 等复杂组件通过多个状态变量管理目录、表、分页、SQL 结果等数据。

### 6.4 样式方案

统一使用 Fluent UI 的 `makeStyles` API 进行组件级样式定义，移除原生 `<style>` 标签与 `<select>` 元素，保持视觉与交互一致性。界面文案统一为中文。

### 6.5 后端设计要点

- **HTTP 客户端复用**：`reqwest::Client` 通过 Tauri 的 `State` 在应用启动时创建一次，并在 `metrics.rs` 中注入复用，避免每次请求新建连接。
- **错误传播**：Rust 后端使用 `?` 与 `map_err` 将错误显式返回给前端，避免 `unwrap_or` 静默吞错。
- **路径安全**：`lance.rs` 中通过 `canonicalize` 校验拼接后的路径仍在基目录内，防止路径遍历。
- **Arrow 数据转换**：`get_table_data` 使用 `array_value_to_json` 按行/列正确提取标量值，避免直接 `format!("{:?}", column)` 输出整列数组。

## 7. 构建与运行

### 7.1 开发环境

```bash
# 安装前端依赖
npm install

# 启动 Tauri 开发模式（同时启动 Vite 与 Rust）
npm run tauri dev
```

### 7.2 生产构建

```bash
# 构建桌面应用安装包
npm run tauri build
```

### 7.3 常用脚本

| 脚本 | 作用 |
|------|------|
| `npm run dev` | 单独启动 Vite 前端开发服务器 |
| `npm run build` | 构建前端产物到 `dist/` |
| `npm run preview` | 预览前端生产构建 |
| `npm run tauri` | 调用 Tauri CLI |

## 8. 注意事项

- `tauri.conf.json` 中 `allowlist` 仅开启 `shell.open` 与 `dialog.open`，如需更多系统能力需显式声明。
- LanceViewer 的 SQL 查询在前端对结果进行内存分页，若查询返回数据量过大可能影响性能。
- TimeConverter 中的单位转换系数使用微秒、纳秒的倒数近似，极端精度场景下需注意浮点误差。
- Lance 数据查看中，未显式支持的 Arrow 类型（如嵌套结构）会回退为调试字符串展示。
