# CC News Hub - 任务清单

## 项目概述
基于 design.md 的 Digital Newsprint 风格，创建纯静态新闻与星座运程网站，通过 GitHub Actions 定时抓取 Yahoo/BBC 新闻和星座 API 数据，支持 GitHub Pages 部署。

---

## 已完成任务

### Phase 1: 项目结构初始化
- [x] 创建 `package.json` - 项目配置
- [x] 创建目录结构：
  - `public/` - 静态文件目录
  - `public/css/` - 样式文件
  - `public/js/` - JavaScript 文件
  - `public/data/` - 数据文件（构建时生成）
  - `scripts/` - 构建脚本
  - `.github/workflows/` - GitHub Actions

### Phase 2: 数据抓取脚本
- [x] 创建 `scripts/fetch-data.js`
  - [x] 配置新闻数据源（Yahoo、BBC）
  - [x] 实现 RSS 解析
  - [x] 实现星座运程生成器（基于日期种子）
  - [x] 输出 `public/data/news.json`
  - [x] 输出 `public/data/horoscope.json`

### Phase 3: 前端页面开发
- [x] 创建 `public/css/style.css` - 样式文件
  - [x] 实现 design.md 定义的颜色变量
  - [x] 配置 Google Fonts 字体加载
  - [x] 实现响应式布局（3 断点：1024px、720px、540px）
  - [x] 新闻卡片网格样式
  - [x] 星座卡片网格样式
  - [x] 动画效果（淡入、悬停等）

- [x] 创建 `public/index.html` - 页面模板
  - [x] Masthead 风格标题
  - [x] 新闻板块结构
  - [x] 星座运程板块结构
  - [x] 分类标签导航

- [x] 创建 `public/js/app.js` - 前端逻辑
  - [x] 数据加载功能
  - [x] 新闻渲染（按分类过滤、日期排序）
  - [x] 星座渲染（12 星座网格、点击展开详情）
  - [x] 交互功能（标签切换、错误提示）

### Phase 4: GitHub Actions 自动化
- [x] 创建 `.github/workflows/build.yml`
  - [x] 定时触发（每 6 小时）
  - [x] 手动触发支持
  - [x] 代码推送时触发
  - [x] 自动提交数据更新

### Phase 5: 配置与文档
- [x] 创建 `.gitignore` - 忽略 node_modules、.env、.DS_Store 等

### Phase 6: 本地测试
- [x] 安装依赖（npm install）
- [x] 执行构建脚本（npm run build）
- [x] 数据抓取测试
  - ✅ Yahoo 國際新聞: 100 articles
  - ✅ BBC World News: 45 articles
  - ✅ BBC 香港與亞太: 18 articles

---

## 待办任务

### 高优先级
- [x] 修复 BBC 香港新聞 RSS 源 URL（当前返回 404）
  - 替换为 `https://feeds.bbci.co.uk/news/world/asia/rss.xml`

### 中优先级
- [x] 本地预览测试
  - 启动静态服务器预览完整页面
  - 验证新闻渲染功能
  - 验证星座卡片展开/收起功能
  - 测试响应式布局（移动设备、平板、桌面）

### 低优先级
- [x] 部署到 GitHub Pages
  - 初始化 Git 仓库
  - 推送到 GitHub
  - 配置 GitHub Pages（从 gh-pages 分支 / 目录）
  - 验证在线访问

- [ ] 优化与增强
  - 添加搜索功能（可选）
  - 添加更多新闻源
  - 优化移动端体验
  - 添加 PWA 支持

---

## 下一步操作

1. **验证部署**：访问 `https://raingor.github.io/CC-news/` 确认站点正常运行
2. **触发数据更新**：在 GitHub Actions 中手动运行 workflow 更新数据
3. **添加更多新闻源**（可选）：在 `scripts/fetch-data.js` 中扩展 NEWS_SOURCES

---

## 技术栈

- **前端**：HTML5 + CSS3 + Vanilla JavaScript
- **字体**：Google Fonts（Playfair Display, Source Serif 4, Outfit, JetBrains Mono）
- **数据抓取**：Node.js + fast-xml-parser
- **自动化**：GitHub Actions
- **部署**：GitHub Pages（静态站点）

---

## 文件结构

```
CC-news/
├── .github/
│   └── workflows/
│       └── build.yml          # GitHub Actions 配置（抓取+部署）
├── css/
│   └── style.css              # 样式文件
├── data/
│   ├── horoscope.json         # 星座运程数据（构建生成）
│   └── news.json              # 新闻数据（构建生成）
├── js/
│   └── app.js                 # 前端逻辑
├── scripts/
│   └── fetch-data.js          # 数据抓取脚本
├── .gitignore
├── design.md                  # 设计规范
├── index.html                 # 页面模板
├── package.json
└── TASK_LIST.md               # 本文件
```

---

## 构建与运行

```bash
# 安装依赖
npm install

# 构建数据（抓取新闻 + 生成星座）
npm run build

# 本地预览
npm run serve
# 或
npx serve .
```

---

## 备注

- 当前版本使用本地生成的星座运程（基于日期种子算法），无需外部 API
- 新闻数据每 6 小时通过 GitHub Actions 自动更新
- 样式完全遵循 design.md 的 Digital Newsprint 风格
- 支持繁体中文和英文双语显示