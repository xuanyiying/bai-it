# OpenEn — 技术架构文档

## 整体架构

```
Chrome 扩展（单包，零后端）
├── Content Script — 扫描页面、渲染分块
├── Background Service Worker — 调 LLM API
├── Popup — 开关、LLM 配置
├── Options 页（React）— 生词本、学习记录、周报、壁纸
└── IndexedDB — 所有数据
```

## LLM 适配层

支持两种 API 格式：

| 格式 | 覆盖的模型 |
|------|-----------|
| Gemini 格式 | Google Gemini 系列 |
| OpenAI 兼容格式 | OpenAI (GPT)、DeepSeek、Kimi、Claude（通过兼容接口）等 |

设计决策：
- Prompt 不按模型调，V1 用一套通用 prompt
- API key 用 `crypto.subtle` AES 加密存储，密钥绑定插件实例
- MV3 Service Worker 生命周期：活跃的 fetch 请求会阻止 SW 被杀，不在 SW 内存中存临时状态

## 数据模型（IndexedDB）

### 全局规则

- 主键全部用 UUID（为 V2 跨设备同步预留）
- 所有表加 `updated_at` + `is_dirty`（同步接口预留）
- IndexedDB 自带 schema 版本管理（`onupgradeneeded`），V1 就内置

### 表结构

| 表名 | 用途 |
|------|------|
| `vocab` | 生词表（单词、状态、释义、音标等） |
| `vocab_contexts` | 生词出处（原句、语境释义、来源 URL） |
| `patterns` | 句式类型（that 从句嵌套等） |
| `pattern_examples` | 句式实例（具体例句） |
| `learning_records` | 阅读记录（原文、分块结果、分析、`llm_provider`、`tokens_used`） |
| `settings` | 用户设置（含 `llm_provider`、`llm_model`、`llm_api_key`） |
| `weekly_reports` | 周报缓存 |
| `review_items` | 间隔重复队列（SM-2 算法） |
| `wallpaper_records` | 壁纸生成记录 |

## 可复用代码（来自旧项目）

| 模块 | 来源 | 复用方式 |
|------|------|---------|
| 规则引擎 | `rule-engine.ts` | 直接复制，纯逻辑零依赖 |
| 分块渲染器 | `renderer.ts` | 直接复制 |
| CSS 样式 | `styles.ts` | 直接复制 |
| DOM 扫描与注入 | `content/index.ts` | 大部分复用，API 调用部分重写 |
| 词汇面板 | `vocab-panel.ts` | 直接复制 |
| IndexedDB 缓存 | `cache.ts` | 直接复制 |
| 类型定义 | `types.ts` | 复用，按需调整 |
| 分块 Prompt | `chunk.ts` | 提取适配两种 API 格式 |
| 站点选择器 | 各站点选择器 | 直接复制 |

## 需要重写的模块

| 模块 | 原因 |
|------|------|
| Background Service Worker | 从调 Cloudflare Workers API → 直调 LLM API |
| Popup | 加 LLM 选择 + API key 输入 |
| 数据存储层 | 从云端 D1 → 本地 IndexedDB |
| 管理界面 | 从独立网站 → 插件 Options 页 |

## 待定

- 构建工具选型
- 项目目录结构
- 具体 API 调用的错误处理策略
