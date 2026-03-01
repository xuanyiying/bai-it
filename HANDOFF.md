# OpenEn — 交接状态

> 每个 session 开始时先看这个文件，结束时更新它。

## 当前状态

分块功能（P0）的需求讨论和技术方案已完成。准备进入两个并行工作流：
1. **编码**：按 architecture.md 的开发顺序开始实现
2. **需求讨论**：管理端（Options 页）的 PRD 需求

## 已完成

- [x] 初始化 git 仓库和文档骨架
- [x] 分块功能需求讨论（扫读 + 细读两种模式）
- [x] 分块功能技术方案（本地优先 + LLM 兜底的两级架构）

## 关键决策记录

### 两种阅读模式
- **扫读模式**：信息流场景（80% 时间），目标是效率。本地规则激进拆分（按长度 + 逻辑转换点断行），复杂句降级到 LLM。即时响应为主。
- **细读模式**：文章场景（20% 时间），目标是成长。规则引擎判断复杂度（提高了长度权重），只拆真正复杂的句子，简单长句留给用户自己读。手动触发按钮兜底。

### 生词标注方案
- **不直接显示中文释义**，用 hover 虚线（用户确认，避免视觉干扰和不准确标注的打扰）
- **三层词汇源**：行业术语包（V1 必须有 AI 包）> 通用离线词典 > LLM 语境化释义
- AI 行业术语包用 LLM + 搜索生成，人工审核后内置

### 模式切换
- 按页面类型（URL + DOM）自动判断，信息流 → 扫读，内容页 → 细读
- 信息流中特别长的内容自动提升辅助力度
- Popup 手动切换兜底

### 技术栈
- 构建工具：ESBuild（沿用旧项目，加 React JSX 支持）
- 单包结构，不做 monorepo
- 旧项目约 1,400 行代码可直接复用（rule-engine、renderer、styles、types、vocab-panel、cache）

## 编码工作流的开发顺序

详见 docs/architecture.md "开发顺序" 章节，共 9 步：
1. 项目骨架（package.json、build.mjs、manifest.json、tsconfig.json）
2. 复制可复用代码
3. LLM 适配层（最小验证）
4. 细读模式
5. 扫读模式
6. 生词系统（离线词典 + 词频表 + AI 行业术语包）
7. Popup
8. IndexedDB 数据层
9. Options 页面（React）

## 需求讨论工作流的下一步

- [ ] 管理端（Options 页）PRD 需求讨论
  - Dashboard、阅读记录、生词本、每日学习、本周回顾
  - 具体 UI 设计和交互

## 参考文件

- 旧项目：`/Users/liuyujian/Documents/Enlearn/`
- 新项目规划原文：`/Users/liuyujian/Documents/Enlearn/newproject.md`
- 扫读模式视觉 mockup：`mockup-scan-mode.html`（用于讨论，不纳入正式代码）
