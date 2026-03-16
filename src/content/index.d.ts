/**
 * Content Script — 页面注入
 *
 * 职责：
 * 1. 统一扫读：所有英文网页自动本地拆分 + 标注生词
 * 2. 手动掰句：未拆开的句子挂触发按钮（无 API → 本地强制拆，有 API → LLM）
 * 3. 分块结果注入 DOM
 * 4. MutationObserver 监听动态内容
 */
export {};
