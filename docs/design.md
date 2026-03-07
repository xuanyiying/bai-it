# 掰it — 设计规范

## 品牌

### 名称

**掰it**（原 OpenEn）

- 中文字「掰」+ 英文词「it」
- 读出来 ≈ **bite**（咬一口）
- 拆开看：掰 = 掰开（核心动作），it = 它（英文句子）
- 合起来是祈使句：「掰它！把这个句子掰开！」
- 谐音 bite → bite-sized chunks（一口大小的块）= 产品做的事

### Tagline

「英文太长？掰it.」

### 一句话介绍

浏览英文网页时，帮你把长句掰成看得懂的段，顺便记住生词。

### 品牌语气

朋友教你东西的口吻——随意、直接、不装。

---

## 语言体系

### 核心术语

| 概念 | 叫法 | 说明 |
|------|------|------|
| 把句子分块 | **掰句** | 核心动作，功能名和按钮都用这个 |
| 分出来的每段 | **段** | 「掰成了 3 段」，不单独命名 |
| 标记生词 | **标生词** | 操作描述 |
| 保存的词汇 | **词盒** | 收起来留着消化 |
| 复习 | **回味** | 品一遍学过的 |
| 快速浏览模式 | **扫读** | 信息流场景 |
| 深入阅读模式 | **细读** | 文章场景 |
| 学习数据/统计 | 不套比喻，直说 | 「今天掰了 X 句」 |

### 品牌动词：掰

「掰」是整套语言体系的核心动词，贯穿所有学习相关的场景：

- 掰句（功能名）
- 掰了几句（统计）
- 掰过的句子（历史）
- 连续掰了 X 天（streak）
- 掰it（品牌名/按钮）

用户第一次接触「掰」是在引导页——「帮你把长句掰成看得懂的段」——建立认知后，后续所有用法自然成立。

### 比喻的三层边界

**放心用掰的地方**——功能名、学习相关的描述

- 掰句、掰it、今天掰了 X 句、掰过的句子、词盒、回味
- 用户在学习语境里，心智模型已经建立

**收着用的地方**——出错、等待、系统状态

- 用朴素直白的表述：「再试一次」「连不上，检查一下网络」
- 用户遇到问题时要的是清楚，不是品牌感

**完全不用的地方**——设置、配置、技术类界面

- 正常说话，不套比喻
- 「API Key」「显示偏好」「保存」

**判断标准：如果用比喻让用户多想了一秒才明白，就不该用。**

---

## UI 文案参考

### 引导提示条（Onboarding Banner）

管理端在无真实数据时，内容区顶部（导航栏下方、所有模块前面）显示提示条。设置 Tab 下不显示。

| 状态 | 文案 |
|------|------|
| 无 API Key | 以下是示例数据。配置 API Key 后，你浏览英文网页时就会自动积累真实的学习数据。[去设置 →] |
| 有 Key 无数据 | 以下是示例数据。去浏览几篇英文网页，掰it 会自动帮你拆句、记词，你的学习数据就会出现在这里。 |

### 首次安装

| 场景 | 文案 |
|------|------|
| 欢迎页标题 | 英文长句看着头大？掰开就好了 |
| 欢迎页副标题 | 掰it 帮你把英文句子拆成一段一段，看完就懂 |
| 填 API Key | 填一个 AI 的 API Key，掰句要用 |
| Key 安全提示 | 你的 Key 只存在本地，不会上传到任何地方 |
| 设置完成 | 好了，找句英文试试 |

### 掰句（核心操作）

| 场景 | 文案 |
|------|------|
| 选中句子后的按钮 | 掰it |
| 加载中 | 掰一下... |
| 完成 | 掰好了，一段一段看 |
| 失败 | 再试一次 |
| 网络错误 | 连不上，检查一下网络 |

### 生词

| 场景 | 文案 |
|------|------|
| 遇到生词提示 | 不认识？点一下记住它 |
| 已加入词盒 | 放进词盒了 |
| 词盒入口 | 词盒 |
| 词盒空状态 | 还没攒下生词，掰句的时候顺手存 |
| 删除确认 | 从词盒里拿走？ |

### 回味（复习）

| 场景 | 文案 |
|------|------|
| 入口 | 回味 |
| 空状态 | 还没东西可以回味，先去掰几句 |
| 完成 | 今天的回味完了 |
| 提醒 | 有几个词该回味一下了 |

### 扫读模式

| 场景 | 文案 |
|------|------|
| 开启 | 开启扫读 |
| 说明 | 自动帮你掰开页面上的英文长句 |
| 关闭 | 关闭扫读 |

### 学习数据

| 场景 | 文案 |
|------|------|
| 今日统计 | 今天掰了 X 句，记了 X 个词 |
| 历史入口 | 掰过的句子 |
| 历史空状态 | 还没掰过句子，去网页上试试 |
| 周统计 | 这周掰了 X 句 |

不做连续天数/打卡/streak。

### 每日回味

设计理念：**回味，不是复习。** 不制造队列、不打卡、不评分、不记连续天数。打开看一眼，10 秒搞定。一屏完事，不翻页。

| 场景 | 文案 |
|------|------|
| Tab 名 | 每日回味 |
| 副标题 | 打开看一眼，10 秒搞定 |
| 断句区标题 | 断句练习 |
| 断句提示 | 凭语感断，不用想语法 · 断了 X 处 |
| 看答案按钮 | 看答案 |
| 词汇区标题 | 今天掰过的词 |
| 已掌握标记 | ✓ 已掌握 |
| 周统计 | 这周掰了 X 句 |
| 空状态 | 今天还没掰过句子，去浏览英文网页试试 |

**明确不做的事**：进度条、对错评分、连续天数/打卡、队列（"还剩 N 个未复习"）、间隔重复算法、闯关/关卡。

### 难句集

| 场景 | 文案 |
|------|------|
| Tab 名 | 难句集 |
| 空状态 | 还没积累难句，去浏览英文网页，遇到的难句会自动攒在这 |
| 筛选 | 按句式筛选 |

不做搜索。

### Dashboard（总览）

| 场景 | 文案 |
|------|------|
| Tab 名 | 总览 |
| 统计卡片 | 难句 X 句 / 生词 X 个 / 已掌握 X 个 |
| CTA 按钮 | 每日回味 → |
| 周报标题 | 本周回顾 |
| 周报空状态 | 用满一周后生成回顾 |

### 设置页

| 场景 | 文案 |
|------|------|
| Tab 名 | 设置 |
| API Key 区标题 | API Key |
| Provider 列表 | Gemini / ChatGPT / DeepSeek / Qwen / Kimi |
| Key 输入标签 | {Provider} API Key |
| Key 安全提示 | 你的 Key 只存在本地，不会上传到任何地方 |
| Key 验证成功 | ✓ 已验证 |
| 模型选择标签 | 模型 |
| 模型提示（Gemini） | 掰句消耗 token 很少，Flash 足够且免费额度高。想要更准可以选 Pro。 |
| 显示偏好区标题 | 显示 |
| 母语 | 母语（生词释义用这个语言显示） |
| 默认掰句力度 | 少掰 / 中等 / 多掰（可在 Popup 中针对单个站点覆盖） |
| 默认显示方式 | 详细 / 简洁 / 轻微 |
| 数据区标题 | 数据 |
| 数据统计 | X 句难句 · X 个生词 · 共 XXKB |
| 导出 | 导出 JSON |
| 危险操作 | 清空学习记录 / 重置所有设置 |
| 保存 | 保存 |
| 已保存 | ✓ 已保存 |

### Popup

| 场景 | 文案 |
|------|------|
| 主按钮（开启状态） | 显示原文 |
| 主按钮（关闭状态） | 掰it |
| 站点开关 | 总是掰 x.com |
| 辅助力度 | 掰多少 |
| 力度说明（低） | 只掰最难的句子 |
| 力度说明（中） | 复杂句自动掰，简单句不打扰 |
| 力度说明（高） | 尽量都掰开 |
| 显示方式 | 掰完怎么显示 |
| 更多设置 | 更多设置 → |

---

## Logo

### 字体

| 元素 | 字体 | 字重 | 说明 |
|------|------|------|------|
| 掰 | ZCOOL KuaiLe | 400（唯一字重） | 圆润手写感，温暖但不幼稚 |
| it | Nunito | 600 | 圆润几何体，比掰轻一档，做搭档不抢戏 |

### 字号比例

掰 : it ≈ 1.25 : 1。参考值：

| 场景 | 掰 | it | margin-left |
|------|----|----|-------------|
| 启动页/Key Visual | 96px | 76px | 3px |
| 页面标题 | 48px | 38px | 2px |
| 导航栏 | 24px | 19px | 1px |
| Popup 顶部 | 20px | 16px | 1px |
| 最小可读 | 14px | 11px | 1px |

### 对齐

baseline 对齐。不用 center 或 top 对齐。

### 颜色策略

**Wordmark 同色，红色只给 icon。**

- 暗色背景：掰it 均为 #fafafa（白字）
- 亮色背景：掰it 均为 #0a0a0a（黑字）
- 红底白字：**仅用于图标系统**（Chrome 扩展 icon、favicon、商店图）

不对掰和 it 分色。同色 = 读作一个词。

### 图标系统

红底（#ef4444）圆角方块，所有尺寸只放一个「掰」字（ZCOOL KuaiLe 400，白色）。

设计原因：Chrome 工具栏图标实际显示约 16-20px，"掰it" 两个元素挤在一起完全看不清。单字大而清晰，识别度更高。

| 尺寸 | 内容 | 字号 | 圆角 | 用途 |
|------|------|------|------|------|
| 128px | 掰 | 88px | 22% | Chrome 商店大图 |
| 48px | 掰 | 34px | 22% | 扩展管理页 |
| 16px | 掰 | 12px | 22% | 工具栏 favicon |

垂直居中注意：ZCOOL KuaiLe 字形偏下，需加 `transform: translateY(-4%)` 视觉修正。

### 状态指示

主图标永远保持红色品牌色不变。启用状态用右下角的**小绿点**表示。

| 状态 | 图标 | 说明 |
|------|------|------|
| 启用 | 红色图标 + 右下角小绿点 | 正在工作 |
| 禁用 / 暂停 | 红色图标（无绿点） | 没在干活 |

绿点参数：
- 颜色：`#22c55e`（设计系统 success 色）
- 白色描边：1px（小尺寸）~ 2px（大尺寸），用于和红色背景区分
- 大小：约图标尺寸的 22%（128px → 28px，48px → 10px，16px → 4px）
- 位置：右下角，紧贴圆角内边缘

实现方式：`chrome.action.setIcon()` 动态切换两套 PNG。manifest 默认用无绿点版本。

### 参考文件

- Logo 定稿确认：`_local/playgrounds/playground-logo-final.html`
- Logo 字体探索过程：`_local/playgrounds/playground-logo-v4.html`（24 种字体组合）
- Logo 可爱度调节：`_local/playgrounds/playground-logo-v5.html`（12 档梯度）

---

## 视觉风格：「锐 Sharp」

### 基调

- **底色**：#09090b（近纯黑）
- **强调色**：#ef4444（红色）
- **质感**：暗色系，锐利，有科技感但不冷漠

### 字体

- **Logo 掰字**：ZCOOL KuaiLe 400
- **Logo it**：Nunito 600
- **标题/数字**：Syne 800
- **正文/UI**：Space Grotesk 400/500

### 质感元素

- 毛玻璃卡片（backdrop-blur + rgba 白底）
- 1px 红色渐变边框
- SVG noise 纹理
- 红色极光呼吸渐变（背景装饰）

### 按钮

- 红色实底 + 红色 glow（box-shadow 双层）+ 小圆角 6px

### 动效

- Stagger 入场：0.05s 间隔
- 缓动：cubic-bezier(0.16, 1, 0.3, 1)
- 时长：0.7s

### 参考文件

- 视觉原型：`_local/playgrounds/playground-visual-directions.html`（浏览器打开，选「锐 Sharp」查看效果）
- 六页面设计原型：`_local/playgrounds/playground-pages.html`（总览 / Popup / 每日回味 / Content Script / 难句集 / 设置）
- Logo 定稿：`_local/playgrounds/playground-logo-final.html`

---

## 设计 Token

编码时直接用这些值。完整 CSS 参考 `_local/playgrounds/playground-pages.html`。

### 颜色系统

**背景**

| 用途 | 值 |
|------|-----|
| 页面底色 | `#09090b` |
| 卡片背景（毛玻璃） | `rgba(255,255,255,0.03)` |
| 输入框/选择器背景 | `rgba(255,255,255,0.04)` |
| 边框（默认） | `rgba(255,255,255,0.06)` |
| Toggle 关闭态 | `rgba(255,255,255,0.08)` |
| Content Script 掰句卡片 | `#0c0c0e` |
| 网页背景（Content Script 模拟） | `#ffffff` |

**文字**

| 用途 | 值 |
|------|-----|
| 标题/大数字 | `#fafafa` |
| 正文（主句/主要信息） | `rgba(255,255,255,0.7)` ~ `rgba(255,255,255,0.85)` |
| 二级文字 | `rgba(255,255,255,0.5)` |
| 三级文字/标签 | `rgba(255,255,255,0.35)` |
| 四级/辅助 | `rgba(255,255,255,0.25)` |
| 极淡/提示 | `rgba(255,255,255,0.15)` ~ `rgba(255,255,255,0.2)` |
| 从句/缩进部分 | `rgba(255,255,255,0.28)` ~ `rgba(255,255,255,0.32)` |

**红色体系**

| 用途 | 值 |
|------|-----|
| 强调色/按钮 | `#ef4444` |
| 按钮 hover | `#f87171` |
| 标签/高亮文字 | `#fca5a5` |
| 生词文字 | `#f87171` |
| 生词虚线 | `rgba(239,68,68,0.35)` |
| 选中态背景 | `rgba(239,68,68,0.12)` |
| 断点选中 glow | `rgba(239,68,68,0.4)` |
| 红色渐变边框起点 | `rgba(239,68,68,0.25)` |
| 红色渐变边框中段 | `rgba(239,68,68,0.06)` |

**状态色**

| 用途 | 值 |
|------|-----|
| 成功/已验证 | `#22c55e` |

### 字号体系

**Syne 800（标题/数字/标签）**

| 场景 | 字号 | 额外属性 |
|------|------|----------|
| 统计大数字 | 42px | letter-spacing: -2px |
| 页面标题（每日回味等） | 28px | letter-spacing: -1px |
| CTA 按钮 | 14px | letter-spacing: 0.5px |
| 章节标题（红色 uppercase） | 13px | letter-spacing: 2px, uppercase |
| 导航 Tab 文字 | 13px | font-weight: 500/600 |
| 小标题（区域标签） | 11px | letter-spacing: 1.5px, uppercase |
| 词频/badge | 10px-11px | letter-spacing: 0.5-1px |

**Space Grotesk 400/500（正文/UI）**

| 场景 | 字号 | 字重 |
|------|------|------|
| 分块句子 | 15px | 400 |
| 句子文字（难句集收起） | 14px | 400 |
| 输入框/选择器 | 13px | 400 |
| 设置项标签 | 14px | 500 |
| 滑杆标签 | 12px | 400/500 |
| 描述/说明 | 12px | 400 |
| 来源/时间/辅助 | 11px | 400 |

### 组件规范

**毛玻璃卡片（.glass）**

```css
background: rgba(255,255,255,0.03);
backdrop-filter: blur(12px);
border-radius: 16px;
/* 1px 红色渐变边框（伪元素 mask 实现） */
border-image: linear-gradient(135deg, rgba(239,68,68,0.25), rgba(239,68,68,0.06), transparent 60%);
```

**导航栏胶囊**

```css
background: rgba(255,255,255,0.04);
backdrop-filter: blur(16px);
border: 1px solid rgba(255,255,255,0.06);
border-radius: 14px;
padding: 4px;
/* Tab 项 */
padding: 9px 20px;
border-radius: 11px;
/* 选中态 */
background: rgba(239,68,68,0.12);
color: #fca5a5;
```

**CTA 按钮**

```css
background: #ef4444;
color: #fff;
border-radius: 6px;
padding: 14px 36px;
font: Syne 700 14px;
box-shadow: 0 0 24px rgba(239,68,68,0.2), 0 0 48px rgba(239,68,68,0.08);
/* hover */
background: #f87171;
box-shadow: 0 0 32px rgba(239,68,68,0.3), 0 0 64px rgba(239,68,68,0.12);
transform: translateY(-1px);
```

**Toggle 开关**

```css
width: 40px; height: 22px;
border-radius: 11px;
/* 关闭态 */ background: rgba(255,255,255,0.08);
/* 开启态 */ background: #ef4444;
/* 滑块 */ width: 18px; height: 18px; border-radius: 50%; background: #fff;
```

**分段选择器（Segmented Control）**

```css
background: rgba(255,255,255,0.04);
border: 1px solid rgba(255,255,255,0.06);
border-radius: 10px;
padding: 3px;
/* 按钮 */ padding: 8px 0; border-radius: 8px;
/* 选中态 */ background: rgba(239,68,68,0.12); color: #fca5a5;
```

**输入框**

```css
padding: 8px 14px;
border-radius: 8px;
background: rgba(255,255,255,0.04);
border: 1px solid rgba(255,255,255,0.08);
color: rgba(255,255,255,0.5);
/* focus */ border-color: rgba(239,68,68,0.3);
```

**筛选 Chip**

```css
padding: 6px 14px;
border-radius: 8px;
background: rgba(255,255,255,0.04);
border: 1px solid rgba(255,255,255,0.06);
color: rgba(255,255,255,0.3);
/* 选中态 */
background: rgba(239,68,68,0.12);
border-color: rgba(239,68,68,0.2);
color: #fca5a5;
```

**句式标签（Pattern Tag）**

```css
font: Syne 600 11px;
padding: 5px 14px;
border-radius: 8px;
background: rgba(239,68,68,0.12);
color: #fca5a5;
```

**断句竖线（Break Point）**

```css
width: 3px; height: 20px;
border-radius: 2px;
background: rgba(239,68,68,0.15);
/* hover */ background: rgba(239,68,68,0.4); width: 4px;
/* 选中 */ background: #ef4444; box-shadow: 0 0 16px rgba(239,68,68,0.4); width: 4px; height: 24px;
```

**引导提示条（Onboarding Banner）**

```css
padding: 16px 24px;
background: rgba(239,68,68,0.04);
border: none;
border-left: 3px solid rgba(239,68,68,0.5);
border-radius: 0 10px 10px 0;
/* 位置：导航栏下方、所有内容模块前面 */
/* "去设置 →" 按钮 */
.banner-link {
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.15);
  color: #fca5a5;
  border-radius: 6px;
  padding: 8px 20px;
}
```

**生词 Tooltip**

```css
background: #1a1a1e;
border: 1px solid rgba(239,68,68,0.15);
border-radius: 8px;
padding: 8px 14px;
box-shadow: 0 4px 20px rgba(0,0,0,0.4);
/* 箭头用 border 三角实现 */
```

### 动效 Token

| 属性 | 值 |
|------|-----|
| 入场缓动 | `cubic-bezier(0.16, 1, 0.3, 1)` |
| 入场时长 | `0.7s` |
| Stagger 间隔 | `0.05s` |
| 面板切换 | `0.55s` + scale(0.98→1) |
| 按钮/交互 | `0.3s` |
| 极光呼吸周期 | `10s ease-in-out infinite alternate` |

### Noise 纹理

```css
background-image: url("data:image/svg+xml,..."); /* fractalNoise, baseFrequency 0.75 */
opacity: 0.03;
```

完整 SVG data URI 见 `_local/playgrounds/playground-pages.html` 中的 `.noise` class。

### 极光呼吸

```css
background:
  radial-gradient(ellipse 50% 45% at 25% 20%, rgba(239,68,68,0.07) 0%, transparent 70%),
  radial-gradient(ellipse 40% 50% at 80% 85%, rgba(239,68,68,0.04) 0%, transparent 70%);
animation: breathe 10s ease-in-out infinite alternate; /* opacity 1→0.5→1 */
```

---

## 页面布局规范

Options 页的四个 Tab（总览、每日回味、难句集、设置）共享同一个顶部导航栏。Popup 和 Content Script 是独立界面。

### 引导态布局

四个 Tab 始终可见。无真实数据时展示示例数据 + 顶部提示条。

- **提示条位置**：导航栏下方，所有内容模块前面（让用户第一眼看到）
- **提示条视觉**：左侧红色竖线 callout 风格，和毛玻璃内容卡片明确区分
- **设置 Tab**：始终可操作，不显示提示条
- **切换条件**：`learning_records` 表有 ≥ 1 条记录时，所有 Tab 同时切换到真实数据，提示条消失
- **设计原型**：`_local/playgrounds/playground-onboarding.html`

### 共享导航栏

- 左侧：掰it logo（导航栏尺寸：掰 24px / it 19px）
- 右侧：毛玻璃胶囊 Tab 切换器（总览 / 每日回味 / 难句集 / 设置）
- 当前 Tab 高亮：红色半透明底 + #fca5a5 文字

### 总览（Dashboard）

- **容器**：max-width 1000px，背景 #09090b，圆角 20px
- **内边距**：40px 48px
- **统计行**：3 列等宽毛玻璃卡片（难句 / 生词 / 已掌握），数字用 Syne 800 42px
- **掰过的句子**：红色小标题 + 毛玻璃句子卡片（句式标签 + 缩进分块 + 生词虚线）
- **CTA 按钮**：红色实底「每日回味 →」

### Popup

- **容器**：固定宽 360px，背景 #09090b，圆角 16px
- **Header**：掰it logo（Popup 尺寸：掰 20px / it 16px）+ 当前域名
- **主按钮**：全宽红色按钮（开启态「显示原文」/ 关闭态「掰it」）
- **站点开关行**：文字 + toggle 开关
- **设置区**：
  - 掰多少：三段文字标签 + 滑杆 + 一句话说明
  - 显示方式：三段选择器（详细/简洁/轻微）+ 说明 + 缩进预览
- **Footer**：「更多设置 →」链接

### 每日回味

- **容器**：max-width 1000px（与其他 Options Tab 一致）
- **内边距**：40px 48px
- **标题行**：左「每日回味 + 副标题」右「这周掰了 X 句」
- **断句练习**：
  - 小标题「断句练习」（Syne 11px uppercase）
  - 毛玻璃卡片内放裸句，句中嵌入可点击的竖线断点（3px 宽，hover 变宽变亮，选中态红色发光）
  - 底部：左侧提示文字，右侧「看答案」按钮
- **高频词汇**：
  - 小标题「今天掰过的词」
  - 3 列网格，每格一个毛玻璃卡片：单词（#f87171）+ 遭遇频次（×N）+ 中文释义
  - 已掌握的词底部加淡色分隔线 + 「✓ 已掌握」

### Content Script 覆盖层

- **背景**：白色网页上叠黑色掰句卡片
- **掰句卡片**：
  - 背景 #0c0c0e，圆角 12px，红色渐变边框
  - Badge：红色圆点 + 掰it logo（小号）+ 句式标签
  - 分块文字：主句亮（0.85 白），从句缩进暗（0.32 白）
  - 生词：#f87171 + 红色虚线下划线，hover 弹释义 tooltip
- **简单句**：不拆分，生词用红色虚线标注在原文上

### 难句集

- **容器**：max-width 1000px
- **内边距**：40px 48px
- **筛选栏**：句式标签 chip（全部 / 插入补充 / 层层嵌套 / ...），选中态红色
- **收起态**：毛玻璃卡片，句式标签 + 截断原文（2 行）+ 底部 meta（生词数 / 域名 / 时间）
- **展开态**：完整六层内容——原句 → 分块 → 为什么难读 → 学会表达 → 生词（pill 形式）

### 设置

- **容器**：max-width 1000px
- **内边距**：40px 48px
- **API Key 区**：
  - 红色小标题
  - 毛玻璃卡片内：Provider 按钮行（Gemini / ChatGPT / DeepSeek / Qwen / Kimi）→ Key 输入 + 验证状态 → 模型选择 → 提示文字
- **显示区**：母语选择 + 默认掰句力度（三段）+ 默认显示方式（三段）
- **数据区**：本地数据统计 + 导出 JSON + 危险操作（清空/重置）
- **保存**：红色按钮 + 已保存反馈
