# 技术计划：原地 DOM 注入（保留链接）

## 问题

当前架构"隐藏原始元素 + 插入纯文本 chunked div"会丢失所有 `<a>` 链接。Twitter 等站点的推文经常同时包含有价值的长句和 URL 链接。

## 调研结论

| 参考项目 | 关键策略 | 启发 |
|---------|---------|------|
| 沉浸式翻译 | 永远不动原始 DOM，只在段落下方插入新元素 | 非破坏性原则 |
| SplitType | 递归遍历 DOM，只操作 text node，保留嵌套元素（`<a>`、`<button>`） | 文本节点级手术 |
| 浏览器高亮扩展 | TreeWalker + splitText() 在文本中插入标记 span，跳过已有链接 | API 选型确认 |

核心原则：**只动 text node，不动 element node**。

## 方案设计

### 适用范围

- 含 `<a href="http...">` 的元素 → 走新路径（clone + DOM 手术）
- 不含链接的元素 → 走现有路径（hide + 纯文本 sibling），零风险

### 整体流程

```
原始元素（含 <a>）
  ↓ cloneNode(true)
克隆元素
  ↓ TreeWalker 收集非 URL 文本节点
  ↓ 拼接文本 → scanSplit → 找到分块断点
  ↓ 反向遍历断点 → splitText() + insertBefore(<br>)
  ↓ 可选：vocab 标注（同样用 splitText 包 <span>）
处理完的克隆
  ↓ 隐藏原始 + 插入克隆（复用现有 insertChunkedElement）
```

### 为什么用克隆而非原地修改

- 克隆不在 React 虚拟 DOM 树中 → 无 reconciliation 风险
- 隐藏原始 + 插入克隆 = 现有策略，pause/resume/deactivate/MutationObserver 全部复用
- 恢复时 remove 克隆 + unhide 原始 = 和现在一样

### 关键算法：文本节点收集 + 断点映射

#### Step 1: TreeWalker 收集文本节点

```js
const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT, {
  acceptNode(node) {
    // URL 链接内部的文本 → 跳过（不参与 scanSplit）
    const anchor = node.parentElement?.closest('a[href^="http"]');
    if (anchor) return NodeFilter.FILTER_REJECT;
    return NodeFilter.FILTER_ACCEPT;
  }
});
```

结果：收集到有序的 text node 列表，跳过 URL `<a>` 内部文本。

非 URL 的 `<a>`（@mention、#hashtag）的文本节点正常收集 —— 它们是句子的一部分。

#### Step 2: 构建文本 + 位置映射

```js
const entries = []; // { node, globalStart, globalEnd }
let fullText = "";
for (const node of textNodes) {
  entries.push({ node, globalStart: fullText.length, globalEnd: fullText.length + node.textContent.length });
  fullText += node.textContent;
}
```

`fullText` = 所有非 URL 文本拼接，每个字符都能映射回具体的 text node + 本地偏移。

#### Step 3: 段落 + 句子 + scanSplit

从 `fullText` 中提取段落、拆句子、跑 scanSplit，和现有逻辑一致。

产出：一组断点位置（`fullText` 中的字符偏移）。

段落边界检测：两个相邻 text node 之间如果存在 block 元素（`<br>`、`<div>` 等），视为段落分隔。

#### Step 4: 反向插入 `<br>` + 缩进

从后往前遍历断点（避免偏移失效）：

```js
for (const bp of breakpoints.reverse()) {
  const entry = entries.find(e => bp.offset >= e.globalStart && bp.offset < e.globalEnd);
  const localOffset = bp.offset - entry.globalStart;
  const remainder = entry.node.splitText(localOffset);
  const br = document.createElement('br');
  remainder.parentNode.insertBefore(br, remainder);
  // 缩进：用 span 包裹 remainder 到下一个断点之间的内容
  if (bp.level > 0) {
    const indent = document.createElement('span');
    indent.className = `enlearn-indent-${bp.level}`;
    indent.style.paddingLeft = `${bp.level}em`;
    // 包裹 remainder（简化：只包裹到下一个 <br>）
    remainder.parentNode.insertBefore(indent, remainder);
    indent.appendChild(remainder);
  }
}
```

#### Step 5: Vocab 标注（可选，同一遍或第二遍）

对克隆中的非 URL 文本节点，查找生词 → splitText + 包 `<span class="enlearn-word">`。

### `<a>` 分类处理

| 类型 | href 示例 | 文本示例 | 处理方式 |
|-----|----------|---------|---------|
| URL 链接 | `https://t.co/xxx` | `https://claude.com/...` | 文本节点跳过不收集，`<a>` 原样保留 |
| @mention | `/username` | `@elonmusk` | 文本节点正常收集（是句子的一部分），`<a>` 包装保留 |
| #hashtag | `/hashtag/AI` | `#AI` | 同上 |

chunk 断点在词边界，不会落在 `@username` 或 `#hashtag` 的中间。如果断点恰好在 `<a>` 内部文本节点上（极端情况），跳过该断点不插入。

### 缩进渲染

现有 5 级 intensity 中，L3-L5 需要分行。在克隆方案中：
- L5/L4/L3：插入 `<br>` + 缩进 `<span>`（如上）
- L2/L1：不插入 `<br>`，改用分隔符 `·` 或透明度标记 — 这些可以在文本节点间插入 `<span>` 实现

### 不改的部分

- `insertChunkedElement`：隐藏原始 + 插入克隆，逻辑不变（克隆替代原来的 chunked div）
- `restoreProcessedElements`：移除克隆 + unhide 原始，逻辑不变（克隆有 `.enlearn-chunked` class）
- `MutationObserver`：检测到原始元素变化时 restore + rescan，不变
- `pause/resume`：隐藏/显示逻辑不变
- 不含链接的元素：完全走现有路径，不受影响

## 实现步骤

### Step 1: 提取 processElementWithLinks 函数

在 `scanPage` 中，对含链接的元素走新路径：

```js
// 在 scanPage 的元素循环中：
const hasUrlLinks = el.querySelector('a[href^="http"]') !== null;
if (hasUrlLinks) {
  processElementWithLinks(el);
} else {
  // 现有逻辑不变
}
```

### Step 2: 实现核心 DOM 手术

`processElementWithLinks(el)`:
1. `clone = el.cloneNode(true)`
2. TreeWalker 收集文本节点
3. 构建 fullText + 位置映射
4. 段落检测 + scanSplit + 断点计算
5. 反向 splitText + 插入 `<br>`
6. Vocab 标注
7. 给 clone 加 `.enlearn-chunked` class
8. `insertChunkedElement(el, clone)`

### Step 3: 清理

- 移除 `filterUrlParagraphs` 函数（不再需要）
- 移除句子级 URL_PATTERN 检查（不再需要）
- 保留 `URL_PATTERN` 常量（TreeWalker filter 用）

## 测试矩阵

| 场景 | 预期结果 |
|------|---------|
| Twitter 推文 + 末尾 URL | 文本被拆分，URL 链接保留可点击 |
| Twitter 推文 + @mention | 文本被拆分，@mention 链接保留，位置正确 |
| Twitter 推文无链接 | 走现有路径，行为不变 |
| Substack 文章段落（含内链） | 文本被拆分，链接保留 |
| 暂停/恢复 | 克隆隐藏/显示，原始元素恢复 |
| 停用扩展 | 克隆移除，原始元素恢复 |
| 手动触发 | 对未自动拆分的元素，手动拆分时也走新路径 |

## 风险与回退

- **回退点**：`git revert a8e6d7d`，一步回到重构前状态
- **渐进式**：只对含链接的元素走新路径，不含链接的元素不受影响
- **最坏情况**：克隆中的 DOM 手术出错 → 克隆显示异常，但原始元素仍在 DOM 中可恢复
