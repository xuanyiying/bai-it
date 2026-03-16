/**
 * IndexedDB 缓存层
 * 按句子内容哈希缓存 AI 分块结果，同一句话第二次出现时直接读缓存。
 */
import type { ChunkResult } from "./types.ts";
/**
 * 简单的字符串哈希（FNV-1a 变体）
 */
export declare function hashString(str: string): string;
/**
 * 从缓存获取分块结果
 */
export declare function getCached(sentence: string): Promise<ChunkResult | null>;
/**
 * 批量查缓存
 */
export declare function getCachedBatch(sentences: string[]): Promise<Map<string, ChunkResult>>;
/**
 * 存入缓存
 */
export declare function setCache(sentence: string, result: ChunkResult): Promise<void>;
/**
 * 批量存入缓存
 */
export declare function setCacheBatch(pairs: {
    sentence: string;
    result: ChunkResult;
}[]): Promise<void>;
