# 掰it — 技术架构文档

## 整体架构

```
Chrome 扩展（单包，零后端）
├── Content Script — 全站自动扫读 + 手动触发 + 数据采集
├── Background Service Worker — 调 AI API、处理手动触发请求
├── Popup — 站点开关、辅助力度、显示方式
├── Options 页（React）— 难句集（懒处理）、每日回味、总览、设置
└── IndexedDB — 所有数据（含 pending_sentences 待分析队列）
```

## 构建工具

**ESBuild**，沿用旧项目方案。

- 3 个开发依赖：esbuild、typescript、vitest（Options 页加 React 相关依赖）
- 4 个入口点：content、background、popup、options
- ESM 输出格式（MV3 Service Worker 要求）
- 开发模式：watch + sourcemap；生产模式：minify

不使用 Vite/Webpack/Plasmo。ESBuild 原生支持 JSX，足够覆盖 Options 页的 React 需求。

## 项目目录结构

```
掰it/
├── src/
│   ├── content/              # Content Script
│   │   ├── index.ts          # DOM 扫描、自动扫读、手动触发、数据采集
│   │   ├── renderer.ts       # 分块结果渲染（复用旧项目）
│   │   ├── styles.ts         # CSS（复用旧项目）
│   │   └── vocab-panel.ts    # 词汇面板（复用旧项目）
│   ├── background/           # Service Worker
│   │   └── index.ts          # AI 调用、批量处理、缓存
│   ├── popup/                # Popup UI
│   │   └── index.ts          # 开关、模式切换、AI 配置
│   ├── options/              # Options 页（React）
│   │   └── App.tsx           # 生词本、学习记录等
│   └── shared/               # 共享模块
│       ├── types.ts          # 类型定义（复用旧项目，按需调整）
│       ├── rule-engine.ts    # 英文检测 + 复杂度估算（isEnglish、estimateComplexity）
│       ├── scan-rules.ts     # 自动扫读本地拆分规则
│       ├── cache.ts          # IndexedDB 缓存（复用旧项目）
│       ├── db.ts             # IndexedDB 数据层（新写，10 张表，含 pending_sentences）
│       └── AI-adapter.ts    # AI 适配层（新写）
├── data/
│   ├── word-frequency.json   # 英文常用词频表（内置，离线）
│   ├── dict-ecdict.json      # 通用离线词典（ECDICT 或类似开源词典）
│   └── industry-ai.json      # AI 行业术语包（V1 内置）
├── dist/                     # 构建输出
├── manifest.json
├── popup.html
├── options.html
├── build.mjs
├── package.json
└── tsconfig.json
```

## 分块功能的技术实现

### 两级处理：本地优先，AI 兜底

分块不是"全部本地"或"全部 AI"，而是两级：

```
句子进入
  ↓
本地规则判断：能本地拆吗？
  ├── 能（大部分句子）→ 本地拆分 + 离线词典标注生词 → 即时显示
  └── 不能（复杂句）→ 调 AI 拆分 + AI 返回语境化生词释义 → 1-2 秒后显示
```

不再区分扫读/细读两种模式。所有英文网页统一处理流程：

### 自动扫读处理流程（所有页面）

1. **本地规则拆分**（scan-rules.ts）
   - 不依赖从句标记词，核心判断：句子长度 + 逻辑转换点
   - 在逻辑转换点断行：并列（and/or/but）、转折（however/although）、条件（if/unless）、因果（because/therefore）、从句引导（which/who/that）等
   - 长度阈值可调（短/中/长三档，默认中）
   - 保留缩进层级
   - **即时完成，零 API 成本**

2. **生词标注（本地）**
   - 词频表过滤：不在常用 5000-8000 词表里的词 → 标注虚线
   - 行业术语包优先：用户勾选的行业（V1 默认 AI 行业），术语用行业语境释义覆盖通用词典义
   - 已知词过滤：用户标记为"已掌握"的词自动跳过
   - 释义来源：行业包 > 离线词典 > 不标注
   - hover 显示释义，不直接展示

3. **数据采集（后台静默）**
   - 扫读过程中遇到的句子 + 生词 + 来源 URL + 时间戳，存入 IndexedDB `pending_sentences` 表
   - 零成本，不影响渲染性能

### 手动触发处理流程

1. **无 API key**：本地强制拆分（忽略长度阈值，调用 scanSplit 但 threshold 设为最低）
2. **有 API key**：发 AI 深度分析，返回分块 + 句式分类 + 讲解 + 表达 + 语境化释义
3. **数据采集**：手动触发的句子标记 `manual: true`，优先级高于自动采集

### 管理端懒处理流程

用户打开管理端 → 从 `pending_sentences` 拉取未分析的句子 → 按页发 AI（每页 10 条）→ 分析结果存入 `learning_records` → 下次不重复分析。详见 PRD「数据采集策略」。

### 删除的逻辑

- ~~`detectReadingMode()`~~：不再按站点判断模式
- ~~细读模式复杂度判断~~：不再自动发 AI，统一由手动触发
- ~~模式自动判断表~~：不再维护站点-模式映射

## 生词系统的词汇来源

### 三层词汇源（优先级从高到低）

1. **行业术语包**（data/industry-*.json）
   - V1 内置 AI 行业包
   - 每个包包含几百个术语及其行业语境释义
   - 用户在设置中勾选关注的行业
   - 术语包生成方式：AI + 搜索生成初稿，人工审核后内置

2. **通用离线词典**（data/dict-ecdict.json）
   - 开源词典（如 ECDICT，50+ 万词条）
   - 提供基础释义（可能有多个义项）

3. **AI 语境化释义**
   - 仅在调 AI 时获得（细读模式的复杂句 + 扫读模式的降级复杂句）
   - 基于上下文给出精准释义

### 已知词过滤

- 用户标记"已掌握"的词存入 IndexedDB vocab 表
- 标注生词时自动跳过已掌握的词
- 用得越久，标注越精准

## AI 适配层

支持两种 API 格式：

| 格式 | 覆盖的模型 |
|------|-----------|
| Gemini 格式 | Google Gemini 系列 |
| OpenAI 兼容格式 | OpenAI (GPT)、DeepSeek、Kimi、Claude（通过兼容接口）等 |

### 用户配置项

- API 格式选择（Gemini / OpenAI 兼容）
- API Key（AES 加密存储）
- Base URL（OpenAI 兼容格式需要，Gemini 用默认）
- 模型名称（下拉或手动输入）

### 设计决策

- Prompt 不按模型调，V1 用一套通用 prompt，从旧项目 chunk.ts 提取适配
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
| `pending_sentences` | **待分析句子队列**（自动扫读 + 手动触发采集的原始句子，管理端按需发 AI 分析） |
| `learning_records` | 阅读记录（原文、分块结果、分析、`AI_provider`、`tokens_used`）— 由管理端懒处理写入 |
| `settings` | 用户设置（含 `AI_provider`、`AI_model`、`AI_api_key`） |
| `weekly_reports` | 周报缓存 |
| `review_items` | 间隔重复队列（SM-2 算法） |
| `wallpaper_records` | 壁纸生成记录 |

#### pending_sentences 表结构

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 主键 |
| `text` | string | 原始句子文本 |
| `source_url` | string | 来源页面 URL |
| `source_hostname` | string | 来源域名（便于按站点筛选） |
| `manual` | boolean | 是否手动触发（手动触发的优先展示） |
| `new_words` | string[] | 本地标注的生词列表 |
| `analyzed` | boolean | 是否已被管理端分析（索引字段） |
| `created_at` | number | 采集时间戳 |
| `updated_at` | number | 更新时间戳 |
| `is_dirty` | boolean | 同步预留 |

## 代码复用（来自旧项目）

### 直接复制（零或极少修改）

| 模块 | 来源 | 行数 |
|------|------|------|
| CSS 样式 | `styles.ts` | 584 |
| 词汇面板 | `vocab-panel.ts` | 417 |
| 分块渲染器 | `renderer.ts` | 201 |
| 类型定义 | `types.ts` | 65 |

### 复用 + 微调

| 模块 | 来源 | 调整内容 |
|------|------|---------|
| 规则引擎 | `rule-engine.ts` | 提高长度权重 |
| IndexedDB 缓存 | `cache.ts` | 适配新的数据层 |
| 分块 Prompt | `chunk.ts` | 提取通用 prompt，适配两种 API 格式 |
| 站点选择器 | `content/index.ts` | 提取选择器配置，加入模式判断 |

### 需要重写

| 模块 | 原因 |
|------|------|
| Content Script 主逻辑 | 加入两种模式判断、本地拆分路径 |
| Background Service Worker | 从调 Cloudflare Workers → 直调 AI API |
| Popup | 加 AI 配置、模式切换 |
| 数据存储层 | 从云端 D1 → 本地 IndexedDB（9 张表） |
| 管理界面 | 从独立网站 → 插件 Options 页（React） |

### 新写

| 模块 | 用途 |
|------|------|
| `scan-rules.ts` | 扫读模式本地拆分规则 |
| `AI-adapter.ts` | AI 适配层（Gemini + OpenAI 兼容） |
| `db.ts` | IndexedDB 数据层（9 张表） |
| `data/industry-ai.json` | AI 行业术语包 |
| Options 页 | React 管理界面 |

## 管理端示例数据 + 提示条（技术方案）

### 三种状态

| 状态 | 条件 | 管理端行为 |
|------|------|-----------|
| `no-key` | 所有 Provider 的 apiKey 为空 | 四 Tab 显示示例数据 + 提示条（引导配 key） |
| `has-key-no-data` | 至少一个 Provider 有 apiKey，但 `learning_records` 表为空 | 四 Tab 显示示例数据 + 提示条（引导浏览网页） |
| `has-data` | `learning_records` 表有 ≥1 条记录 | 真实数据，提示条消失 |

设置 Tab 始终可操作，不显示提示条。

### 方案：hooks 感知示例模式

App 层检测状态 → 传 `isExample` 给 Tab → Tab 传给 hook → hook 在示例模式下返回硬编码数据。Tab 渲染逻辑不变。

### 新建文件（3 个）

**`src/options/exampleData.ts`** — 硬编码示例数据

导出三个常量，类型匹配对应 hook 的返回值：
- `EXAMPLE_DASHBOARD: DashboardData` — 统计 23/47/12 + 3 条句子（插入补充/层层嵌套/对比转折）
- `EXAMPLE_REVIEW: ReviewData` — 断句练习（自动驾驶句）+ 3 词汇 + 周统计 15
- `EXAMPLE_SENTENCES` — 5 条句子（覆盖 5 种句式）+ 5 种筛选标签

句子内容见 `docs/prd.md`「示例数据内容」章节。`LearningRecord` 对象用固定 UUID，`created_at` 用相对时间偏移。

**`src/options/hooks/useOnboardingState.ts`** — 状态检测 hook

```ts
type OnboardingState = 'no-key' | 'has-key-no-data' | 'has-data';
function useOnboardingState(db: IDBDatabase | null, config: BaitConfig): {
  state: OnboardingState;
  loading: boolean;
}
```

- `hasKey`：遍历 `config.AI.providers`，任意一个 `apiKey` 非空
- `hasData`：`learningRecordDAO.getAll(db).length > 0`

**`src/options/components/OnboardingBanner.tsx`** — 提示条组件

- Props: `state: OnboardingState`, `onGoToSettings: () => void`
- `has-data` 时返回 null
- CSS：左 3px 红色竖线 callout，`rgba(239,68,68,0.04)` 背景

### 修改文件（6 个）

**`App.tsx`** — 提升状态到顶层

- 将 `useDB()` 和 `useConfig()` 从各 Tab 提升到 App
- 新增 `useOnboardingState(db, config)`
- NavBar 和 Tab 内容之间渲染 `<OnboardingBanner>`（设置 Tab 不渲染）
- 给 Tab 传 `db` 和 `isExample`（`state !== 'has-data'`）

**`useDashboardData.ts` / `useReviewData.ts` / `useSentences.ts`** — 加 `isExample` 参数

示例模式下直接返回对应的 `EXAMPLE_*` 常量，不查 DB。

**`Dashboard.tsx` / `DailyReview.tsx` / `Sentences.tsx`** — 接收新 props

- 接收 `db` 和 `isExample` props（不再自己调 `useDB()`）
- 传 `isExample` 给数据 hook
- DailyReview：示例模式下 `handleToggleMastered` 变 no-op
- 删除原有 EmptyState 分支（示例模式下不会有空状态）

**`Settings.tsx`** — 接收 `db` prop

不再自己调 `useDB()`，但其余逻辑不变。

**Options CSS** — 加提示条样式

```css
.onboarding-banner { ... }
.banner-link { ... }
```

### 不改的文件

- `useConfig.ts` — 不变
- `NavBar.tsx` — 不变
- 所有渲染组件（GlassCard / ChunkLines / PatternTag 等）— 不变
- IndexedDB 数据层 — 不变

### 状态响应

- 配 API key 后切 Tab → `useOnboardingState` 重算 → 提示条文案更新
- 浏览网页产生数据后回到 Options 页 → Tab 重新 mount → hook 查到数据 → 切换到真实模式

## 开发顺序

1. **项目骨架** — package.json、build.mjs、manifest.json、tsconfig.json
2. **复制可复用代码** — rule-engine、renderer、styles、types、cache
3. **AI 适配层** — 先跑通一个最简单的分块请求（最小验证）
4. **细读模式** — 基于旧 content script 改造，自动分块跑起来
5. **扫读模式** — 新写 scan-rules.ts，加模式判断和切换
6. **生词系统** — 离线词典 + 词频表 + AI 行业术语包 + 已知词过滤
7. **Popup** — AI 配置 + 模式切换
8. **IndexedDB 数据层** — 9 张表
9. **Options 页面（React）** — 生词本、学习记录等
