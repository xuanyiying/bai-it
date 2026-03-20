# 掰it — 项目指南

## 项目简介

掰it 是一个英语学习工具，帮助用户在浏览英文网页时拆解长句结构、标注生词。

**双平台**：
- Chrome 扩展：纯本地运行，零后端、零登录
- 移动端（BaiitMobile）：Expo/React Native 应用，内嵌 WebView 浏览标注

详见 [README.md](./README.md)。

## 开发

```bash
npm install        # 安装依赖
npm run build      # 构建到 dist/
npm test           # 运行单元测试（Vitest）
npm run release    # 发布：跑测试 + 构建 + 打包 bai-it.zip
```

构建产物在 `dist/` 目录，加载到 Chrome 的开发者模式即可测试。

## 发布

**当用户表达"可以发版了"的意图时（不限于特定措辞），Claude 自主执行完整发布流程，用户不需要跑任何命令。** 详见 [docs/release.md](./docs/release.md)。

流程概要：确认版本号 → 改 manifest.json → `npm run release` → git commit + tag + push → `gh release create` → 提醒用户手动上传商店 → 清理 zip。

商店上传是唯一需要用户手动操作的步骤（需要登录网页后台）。

## 项目结构

```
src/
├── background/    # Service Worker（MV3）
├── content/       # Content Script（网页注入）
├── popup/         # 插件弹窗
├── options/       # 管理页面（React）
│   ├── components/
│   ├── hooks/
│   └── tabs/
└── shared/        # 共享模块（DB、AI、词汇、规则引擎）
data/              # 词频表 + 离线词典
tests/             # 单元测试 + 浏览器验收测试
docs/              # 产品需求 / 设计规范 / 技术架构
_local/            # 内部文件（.gitignore 排除，不进 git）
```

## 构建配置

- **ESM** 仅用于 background service worker（MV3 要求 `type: module`）
- **IIFE** 用于 content script、popup、options（Chrome 不支持 content script ESM）

## 数据存储

- **IndexedDB**（`openen-data`）：学习记录、生词、待分析句子等
- **chrome.storage.sync**：AI 配置、站点开关等用户偏好
- **chrome.storage.local**：已掌握词列表

## 移动端（BaiitMobile）

基于 Expo (React Native) 的移动应用，与 Chrome 扩展共享核心词汇分析逻辑。

### 移动端开发

```bash
cd BaiitMobile
npm install        # 安装依赖
npm start          # 启动 Expo 开发服务器
npm run ios        # 运行 iOS 模拟器
npm run android    # 运行 Android 模拟器
```

### 移动端架构

```
BaiitMobile/
├── App.tsx                    # 入口，导航配置
├── src/
│   ├── screens/               # 页面组件（Home, Vocab, Sentences, Stats, Profile, Browser 等）
│   ├── components/            # UI 组件（ui/, vocab/, sentence/, settings/, stats/）
│   ├── contexts/              # React Context（Theme, Language, Auth, Browser）
│   ├── services/              # 业务服务
│   │   ├── database.ts        # AsyncStorage 封装，词汇/句子/学习记录存储
│   │   ├── dictionary.ts      # 词典查询、词汇难度评估
│   │   ├── auth.ts            # 认证服务
│   │   └── tts.ts             # 语音合成
│   ├── themes/                # 主题系统（light, dark, ocean）
│   ├── i18n/                  # 国际化（zh-CN, en-US）
│   ├── data/                  # 离线词典数据
│   └── utils/                 # 工具函数
└── app.json                   # Expo 配置
```

### 数据存储（移动端）

- **AsyncStorage**：词汇本、句子收藏、学习记录、复习项目、统计数据
- 复习算法使用 **SM-2** 间隔重复算法

### 核心功能

- 内嵌 WebView 浏览英文网页，自动标注生词
- 词汇本管理（新词、学习中、已掌握）
- 句子收藏与分析
- 学习统计与连续打卡
- 能力测试
- 订阅管理

## 文档

| 文档 | 内容 |
|------|------|
| [docs/prd.md](./docs/prd.md) | 产品需求：用户痛点、三层体验模型、功能范围 |
| [docs/design.md](./docs/design.md) | 设计规范：视觉风格、品牌、各模块 UI |
| [docs/architecture.md](./docs/architecture.md) | 技术架构：模块设计、数据模型、关键决策 |
| [docs/testing.md](./docs/testing.md) | 测试：验收标准、测试方法 |
| [docs/release.md](./docs/release.md) | 发布流程：版本号 → 打包 → 推送 → 上架 Chrome + Edge |
| [docs/workflow.md](./docs/workflow.md) | 文件组织 + Git 工作流 + 日常操作指引 |

### 内部文档（`_local/`，不进 git）

| 文档 | 内容 |
|------|------|
| [_local/HANDOFF.md](./_local/HANDOFF.md) | 交接状态：当前进度、上次改了什么、下一步 |
| [_local/backlog.md](./_local/backlog.md) | 需求池：想法收集、优先级管理（`/bai-idea` 快速记录） |
| `_local/playgrounds/` | 设计原型 HTML |
| `_local/mockups/` | UI Mockup HTML |
| `_local/store-assets/` | 商店提交文档 + 截图 |
