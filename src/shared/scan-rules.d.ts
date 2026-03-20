/**
 * 扫读模式本地拆分规则
 *
 * 在逻辑转换点断行：并列（and/or/but）、转折（however/although）、
 * 条件（if/unless）、因果（because/therefore）、从句（which/who/that）。
 *
 * 三级颗粒度：
 * - coarse: 仅在逗号+连词处拆分（最保守）
 * - medium: 长句允许无逗号拆分
 * - fine:   更低阈值 + 介词短语 + 引语边界拆分
 *
 * 设计原则：
 * - 即时完成（< 1ms），零 API 成本
 * - 宁可多拆不漏拆（扫读场景，快速理解优先）
 * - 复杂句（3+ 从句标记 + 本地拆不动）降级给 AI
 */
export type Granularity = "coarse" | "medium" | "fine";
export interface ScanChunk {
    text: string;
    level: number;
}
export interface ScanChunkResult {
    chunks: ScanChunk[];
    needsAI: boolean;
}
/**
 * 扫读模式本地拆分
 *
 * @param sentence 要拆分的句子
 * @param threshold 长度阈值 ("short" | "medium" | "long")
 * @param granularity 拆分颗粒度 ("coarse" | "medium" | "fine")
 * @returns 拆分结果，包含分块和是否需要 AI 降级
 */
export declare function scanSplit(sentence: string, threshold?: "short" | "medium" | "long", granularity?: Granularity): ScanChunkResult;
/**
 * 将 ScanChunk[] 转为 renderer 期望的缩进文本格式
 *
 * 格式：每行用前导空格表示缩进级别（2 空格 = 1 级）
 */
export declare function toChunkedString(chunks: ScanChunk[]): string;
