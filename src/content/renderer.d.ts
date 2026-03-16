/**
 * 分块结果渲染器
 *
 * 将分块文本转换为结构化 DOM，包含生词标注（hover 弹窗释义）。
 *
 * 5 个显示方式级别（intensity 1-5）：
 * L5 全拆：分行 + 缩进 + 从句透明度降低
 * L4 缩进：分行 + 缩进（无透明度变化）
 * L3 分行：只分行，不缩进（所有行左对齐）
 * L2 标记：不分行，在拆分点插入 · 分隔符
 * L1 轻标：不分行，从句部分变淡
 */
import type { ChunkResult } from "../shared/types.ts";
/**
 * 将 ChunkResult 渲染为 HTML 字符串
 */
export declare function renderChunkedHtml(result: ChunkResult, intensity?: number): string;
/**
 * 创建分块 DOM 元素
 */
export declare function createChunkedElement(result: ChunkResult, intensity?: number): HTMLElement | null;
