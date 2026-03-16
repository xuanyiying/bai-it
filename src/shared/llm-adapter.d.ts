/**
 * LLM 适配层
 *
 * 支持两种 API 格式：Gemini 和 OpenAI 兼容。
 * 在 Service Worker 中运行，直接调用 LLM API。
 */
import type { LLMConfig, ChunkResult, FullAnalysisResult } from "./types.ts";
export declare function buildChunkPrompt(sentences: string[], knownWords?: string[]): string;
export interface GeminiRequestBody {
    contents: {
        parts: {
            text: string;
        }[];
    }[];
    generationConfig: {
        temperature: number;
        responseMimeType: string;
        thinkingConfig: {
            thinkingBudget: number;
        };
    };
}
export declare function buildGeminiRequest(prompt: string, config: LLMConfig): {
    url: string;
    body: GeminiRequestBody;
};
export interface OpenAIRequestBody {
    model: string;
    messages: {
        role: string;
        content: string;
    }[];
    temperature: number;
    response_format?: {
        type: string;
    };
}
export declare function buildOpenAIRequest(prompt: string, config: LLMConfig): {
    url: string;
    body: OpenAIRequestBody;
    headers: Record<string, string>;
};
interface LLMChunkItem {
    index: number;
    original: string;
    chunked: string;
    is_simple: boolean;
    new_words?: {
        word: string;
        definition: string;
    }[];
}
export declare function parseGeminiResponse(data: unknown): LLMChunkItem[];
export declare function parseOpenAIResponse(data: unknown): LLMChunkItem[];
/**
 * 解析 LLM 返回的 JSON 文本为 ChunkItem 数组
 * 兼容 markdown fence 包裹和直接 JSON
 */
export declare function parseChunkJson(text: string): LLMChunkItem[];
/**
 * 将 LLM 返回的 items 映射为 ChunkResult 数组
 */
export declare function mapToChunkResults(sentences: string[], items: LLMChunkItem[]): ChunkResult[];
/**
 * 调用 LLM API 对句子进行分块
 */
export declare function chunkSentences(sentences: string[], config: LLMConfig, knownWords?: string[]): Promise<ChunkResult[]>;
export declare function buildFullAnalysisPrompt(sentence: string): string;
/**
 * 解析单条完整分析结果 JSON
 */
export declare function parseFullAnalysisJson(text: string): FullAnalysisResult;
/**
 * 对单句进行完整 LLM 分析（句式、分块、讲解、表达、生词）
 */
export declare function analyzeSentenceFull(sentence: string, config: LLMConfig): Promise<FullAnalysisResult>;
export {};
