# CCFOLIA 日志工具 / CCFOLIA Log Toolkit

  ## 简介 | Overview

  本项目是一个基于 React + Vite 的 CCFOLIA 聊天日志工具，支持缓存管理、条件搜索、上下文预览以及多样化的导出定制。界
  面默认使用中文，同时保留英文指引，方便双语用户快速上手。
  This project is a React + Vite toolkit for CCFOLIA chat logs. It provides cache management, advanced search,
  context preview, and customizable export workflows. The UI ships with Simplified Chinese by default while offering
  English guidance side-by-side for bilingual users.

  ## 主要特性 | Key Features

  - 房间缓存管理 / Room Cache Manager
    支持房间同步、强制刷新、备注及 JSON 导入/导出。
    Manage rooms with incremental sync, force refresh, memo fields, and JSON import/export.
  - 多条件搜索 / Advanced Filtering
    关键词（模糊/正则）、频道、角色、时间范围等筛选，带分页与上下文窗。
    Keyword search (fuzzy/regex), channel & role filters, date range, pagination, and context preview.
  - 导出工作区 / Export Workspace
    自定义封面/结尾图、角色样式、本地日志上传、海豹 JSON 导出。
    Configure cover/end images, role styling, local uploads, and Seal-compatible JSON export.
  - 头像 Base64 复用 / Avatar De-duplication
    自动将头像转换为 Base64 并在导出 HTML 中复用，明显减小文件体积。
    Automatically converts avatars to Base64 and reuses them across exported HTML pages.
  - 竖排角色配置 / Vertical Role Panel
    逐条编辑角色姓名、头像（可上传预览）与颜色。
    Edit name, upload avatar with preview, and adjust color per role in a vertical layout.

  ## 快速开始 | Getting Started

  npm install
  npm run dev

  - 访问 http://localhost:5173/ 体验开发版本。
  - Visit http://localhost:5173/ for the dev build.

  ## 构建与部署 | Build & Deploy

  npm run build

  - 构建产物位于 dist/。
  - Deploy the dist/ folder to any static host (e.g., GitHub Pages, Cloudflare Pages).

  ## 链接 | Links

  - 线上体验 / Live Demo: https://sukenell.github.io/cclog_custom/

  ## 许可证 | License

  本项目遵循 MIT License。
  This project is released under the MIT License.

### 鸣谢 | Thinks

https://sukenell.github.io/cclog_custom/

https://www.postype.com/@reha-dev/post/18656933
