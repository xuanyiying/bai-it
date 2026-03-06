# 掰it — 交接状态

> 每个 session 开始时先看这个文件，结束时更新它。

## 当前状态

**词典扩容完成。** 198 个单元测试全通过，构建正常。

### 本次完成（0307 词典大幅扩容：6K→31K 词条）

**问题**：原词典 6125 词条由 AI 手动编写（26 个 batch 文件），覆盖率差。crappy、bolted、suspicion、compaction 等中等难度词全部漏标。

**方案**：基于 ECDICT 开源词典（77 万词条，MIT 协议）重建全部词汇数据。

1. **数据重建**
   - `word-frequency.json`：5566→5806 常用词（BNC/FRQ ≤ 5000 + 基础功能词）
   - `dict-ecdict.json`：6125→31741 词条（BNC/FRQ 5001-30000 + 有考试标签的词）
   - `lemma-map.json`（新）：28751 条词形变体→原形映射（ECDICT exchange 字段）
   - `modern-vocab.json`（新）：122 条 AI/俚语/缩写（prod、repo、vibe、FOMO 等），合并进词典
2. **基础词排除**：~240 个最基础的功能词（is/are/do/go/man/good 等）及其变形，从词典中彻底移除
3. **缩写跳过**：含撇号的词（don't/won't/can't）在 `shouldSkipWord` 中一律跳过
4. **vocab.ts 重构**：新增 `loadLemmaMap()`，`getStemCandidates()` 优先查 lemma 映射表、兜底用后缀规则
5. **构建工具**：`scripts/build-dict-from-ecdict.mjs` 从 ECDICT CSV 一键构建所有数据

**体积影响**：content.js 从 ~350KB 增到 3.2MB（词典+lemma 数据），Chrome 扩展本地缓存可接受。

### 上次完成（0304 设置页精简 + API 调试）

**Settings Tab 大幅精简，只保留 API Key 配置 + 测试连接。** 5 家 provider 模型列表更新为最新 ID。端到端测试连接走完整 `chunkSentences()` 链路。Gemini 3.1 Flash-Lite 和 DeepSeek 已验证跑通。

### 注意事项

- **IndexedDB 数据库名保持 `openen-data` / `openen-cache`**，改名会丢失已有用户数据
- **图标两套 PNG**：`icons/icon*.png`（默认无绿点）+ `icons/icon*-on.png`（启用态有绿点），background 通过 `chrome.action.setIcon()` 动态切换
- **辅助力度滑杆映射**：1-5 档同时控制 `chunkGranularity`（拆分规则激进度）和 `scanThreshold`（扫读最小词数），见 `src/popup/index.ts` ASSIST_TO_CONFIG
- **DOM 插入策略**：`insertChunkedElement()` 隐藏原始元素 + 兄弟插入 + 向上遍历修复 overflow/clamp
- **Twitter 兼容**：
  - 导航：`dispatchEvent` 到原始元素的 React Fiber 节点保持事件委托正常
  - Show more：跳过未展开推文，用户点 "Show more" 后 MutationObserver 自动处理
  - 短文本（< 8 词）不处理，避免干扰推文交互

---

## 下一步

**发布准备**（GitHub 开源 + Chrome Web Store 上架）：

### 发布前必做

1. **完整浏览器验收**（端到端，还没跑过）：
   - 浏览英文网页 → pending_sentences 写入 + 去重
   - 手动触发 → LLM 深度分析
   - 管理端懒处理 → 逐条填充
   - 生词 Tooltip + 掌握标记持久化
   - 引导系统各状态切换
2. **README.md 重写** — 当前版本过时（还写着"壁纸生成"等已删功能），需要面向用户重写
3. **PRIVACY.md 更新** — GitHub 仓库地址待确认后更新链接
4. **.gitignore 补充** — playground/mockup 文件、frontend-slides、截图目录
5. **publishing.md 清单推进** — 按清单逐项完成

### 发布清单概览（详见 `docs/publishing.md`）

**已完成**：MIT License、隐私政策
**待完成**：
- 开源：确认 GitHub 仓库地址、完善 README、检查 .gitignore、依赖 license 兼容性
- Chrome Web Store：注册开发者账号（$5）、准备素材（图标/截图/文案）、权限用途说明、数据披露表、提交审核

---

## 已确定的视觉方向：「锐 Sharp」

- 暗色系 #09090b + 红色 #ef4444
- Logo：ZCOOL KuaiLe 400 + Nunito 600
- UI：Syne 800（标题/数字）+ Space Grotesk 400/500（正文）
- 毛玻璃卡片 + 红色渐变边框 + noise 纹理 + 红色极光呼吸

## Playground 文件索引

| 文件 | 用途 |
|------|------|
| `playground-pages.html` | **六页面设计原型（定稿）**：总览 / Popup / 每日回味 / Content Script / 难句集 / 设置 |
| `playground-onboarding.html` | **引导态设计原型（定稿）**：三种状态切换（无 key / 有 key 无数据 / 有真实数据），示例数据 + 提示条 |
| `playground-vocab-tooltip.html` | **生词 Tooltip + 掌握态设计**：三种 tooltip 风格 + 掌握态对比（已选定"精致"风格 + inherit 融入） |
| `playground-logo-final.html` | **Logo 定稿确认**（ZCOOL KuaiLe + Nunito 600）|
| `playground-visual-directions.html` | 三种字体方向对比（已选定「锐 Sharp」）|
| `playground-logo-v5.html` | Logo 可爱度 12 档梯度微调 |
| `playground-logo-v4.html` | Logo 24 种字体组合探索 |
| `playground-logo-v3.html` | Logo v3 重新思考（一个词原则）|
| `playground-logo.html` | Logo v2 早期 10 方向探索（已过时）|
| `mockup-popup.html` | 早期 Popup 原型（白色版，已过时）|
| `mockup-scan-mode.html` | 扫读模式 mockup（讨论用）|

## 关键决策记录

### 词典架构（0307 重建，基于 ECDICT）
- **数据源**：ECDICT 77 万词条 → 按 BNC/FRQ 筛选 + modern-vocab 补充
- **三文件架构**：word-frequency.json（常用词，不标注）+ dict-ecdict.json（词典，标注）+ lemma-map.json（词形映射）
- **构建工具**：`scripts/build-dict-from-ecdict.mjs`，需要 `/tmp/ecdict.csv`（从 ECDICT GitHub 下载）
- **基础词排除**：~240 个功能词及变形永不进词典
- 现代词汇（AI/俚语/缩写）维护在 `data/modern-vocab.json`，构建时合并

### 三层体验模型（0303，替代原两层产品模型）
- **第一层**：装完即用 — 所有英文网页自动扫读，本地拆分 + 标生词，零配置
- **第二层**：手动掰句 — 用户点哪句拆哪句，无 API 时本地强制拆
- **第三层**：LLM 深度分析 — 有 API 时手动触发走 LLM，结果存管理端
- 详见 `docs/prd.md`「三层体验模型」章节

### 统一扫读（0303，替代原两种阅读模式）
- **不再区分扫读/细读**，删除 `detectReadingMode()` 站点列表
- 所有英文网页统一自动扫读 + 手动触发按需深入
- 详见 `docs/prd.md`「自动扫读 + 手动掰句」章节

### DOM 插入策略（0305 简化）
- **统一兄弟插入**：隐藏原始元素（`display: none`）+ 兄弟插入 chunked div + 向上遍历修复 overflow/clamp
- 向上遍历遇到 `<a>` / `<article>` 边界停止
- Twitter `dispatchEvent` 到原始元素保留 React 事件委托
- Twitter "Show more"：跳过未展开推文，MutationObserver 自动处理展开后的全文

### 数据采集懒处理（0303）
- 浏览时：原始句子存 `pending_sentences` 表（零成本）
- 管理端：打开时按页发 LLM（每页 10 条），翻页再发下一批
- 分析结果缓存到 `learning_records`，不重复发
- 详见 `docs/prd.md`「数据采集策略」章节

### 生词 Tooltip 设计（0304）
- **Tooltip 风格**：精致 — 词名（红色）+ 释义 + 低调掌握按钮
- **掌握态**：`color: inherit` — 融入所在行颜色
- **持久化**：`chrome.storage.local.knownWords` + IndexedDB 双写

### 生词标注方案
- **不直接显示中文释义**，用 hover 虚线（避免视觉干扰）
- **统一词典**：通用词典 + AI 义项合并 > LLM 语境化释义（仅 LLM 调用时获得）
- 所有元素（含未拆分的）都会标注生词

### 学习系统（管理端 Options 页）
- **页面结构**：四个 Tab——总览、每日回味、难句集、设置
- **核心单位是句子不是单词**：不做"生词本"，做"难句集"
- **难句卡片 6 层**：原句 → 句式标签 → 分块 → 句式讲解 → 学会表达 → 生词

### 技术栈
- 构建工具：ESBuild（沿用旧项目，加 React JSX 支持）
- 单包结构，不做 monorepo
- 浏览器测试：Puppeteer

## 已完成

- [x] Step 1-9 编码全部完成
- [x] 品牌命名 + 语言体系 + 视觉方向 + Logo 定稿
- [x] 六页面原型定稿 + 设计规范归档
- [x] Options Puppeteer 验收（39 断言 + 4 Tab 截图）
- [x] 产品方向调整 — ~~两层产品模型~~ → 三层体验模型
- [x] P0 修复：扫读模式生词释义
- [x] Popup UI 改造（锐 Sharp）
- [x] 全局改名 OpenEn → 掰it
- [x] 修复扫读模式拆分过少 + background 报错 + Tooltip 样式优化
- [x] 管理端示例数据 + 提示条（Puppeteer 截图验收通过）
- [x] 统一扫读架构讨论 + 文档更新（prd.md / architecture.md / testing.md）
- [x] **Phase 1 统一扫读重构 + Twitter/Substack 兼容**（编码 + 验证通过）
- [x] **Phase 2 数据采集 + 管理端懒处理**（编码完成）
- [x] **Options 生词 Tooltip + 掌握标记**（精致风格 + inherit 融入 + 持久化）
- [x] **设置页精简 + 模型更新 + 端到端测试连接**（Gemini 3.1 / DeepSeek 已验证跑通）
- [x] **词典合并：删除 industry pack 系统**（AI 义项合并进通用词典，198 测试通过）
- [x] **插件修复：Twitter Show more + DOM 策略增强 + MutationObserver**
- [x] **词典大幅扩容：6K→31K 词条**（ECDICT 重建 + lemma 映射 + 现代词汇 + 基础词排除）

## 编码细节

### 构建配置
- **ESM** 仅用于 background service worker（MV3 要求 `type: module`）
- **IIFE** 用于 content script、popup、options（Chrome 不支持 content script ESM）
- content.js 包含词汇数据打包后约 3.2MB（词典 31K + lemma 28K），Chrome 扩展本地缓存可接受

### 数据文件（data/）
- `word-frequency.json`：5806 常用词（ECDICT BNC/FRQ ≤ 5000 + 基础功能词），不标注
- `dict-ecdict.json`：31741 词条（ECDICT 筛选 + modern-vocab 合并），用于标注
- `lemma-map.json`：28751 条词形变体→原形映射，运行时词形还原
- `modern-vocab.json`：122 条现代词汇（AI/俚语/缩写），构建时合并进词典

### IndexedDB 数据层
- **数据库**：`openen-data`（与缓存数据库 `openen-cache` 独立）— 名称保持不改，避免丢失用户数据
- **10 张表**：原 9 张 + `pending_sentences`
- **全局规则**：UUID 主键、`updated_at` + `is_dirty`（V2 同步预留）、`onupgradeneeded` schema 版本管理
- **SM-2 算法**：review_items 表内置间隔重复
- **settings 表**：键值对存储，给 Options 页学习系统用。Popup/Background 的 LLM 配置仍走 `chrome.storage.sync`
- **测试**：fake-indexeddb mock，68 个单元测试覆盖全部表 CRUD + SM-2 + 跨表业务场景 + v1→v2 升级

### 浏览器测试
- Puppeteer 做浏览器验收测试
- 冒烟测试：`tests/acceptance/smoke-test.mjs`
- 扫读模式测试：`tests/acceptance/scan-mode-basic.mjs`
- Options 页测试：`tests/acceptance/options-test.mjs`
- 引导态截图：`tests/acceptance/onboarding-screenshots.mjs`

### Chrome 调试 profile 问题
旧的 `~/.chrome-debug-profile/` 无法加载扩展。新 profile `~/.chrome-debug-profile-2/` 可以正常加载但缺少 Reddit 登录状态。建议：在用户主力 Chrome 中手动加载 dist/ 目录测试。

## 参考文件

- 旧项目：`/Users/liuyujian/Documents/Enlearn/`
- 新项目规划原文：`/Users/liuyujian/Documents/Enlearn/newproject.md`
- 扫读模式视觉 mockup：`mockup-scan-mode.html`（讨论用）
