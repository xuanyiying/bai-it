/**
 * 词典服务
 *
 * 重构说明：
 * - 移除硬编码的 basicWords（200+ 词），改用词频表统一判断
 * - 移除 properNouns 硬编码列表
 * - 难度评估基于词频而非词长
 * - 推荐使用 VocabAnnotationService 进行生词标注
 */

import {
    initializeDictionaryData,
    isCommonWord,
    isCommonWordWithThreshold,
    getFrequencyRank,
    getLemma,
    shouldSkipWord as shouldSkipWordBase,
    batchGetLemmas,
    batchCheckCommonWords,
    batchCheckCommonWordsWithThreshold,
    isInitialized_complete,
    lookupDefinition,
} from './dictionary-data-service';

export interface WordDefinition {
    word: string;
    phonetic?: string;
    definition: string;
    isCommon: boolean;
    frequency?: number;
    difficulty?: number;
}

let definitionCache: Map<string, WordDefinition> = new Map();

export const Dictionary = {
    async initialize(): Promise<void> {
        await initializeDictionaryData();
    },

    isInitialized(): boolean {
        return isInitialized_complete();
    },

    lookup(word: string): WordDefinition | null {
        if (!word || typeof word !== 'string') return null;
        const normalized = word.toLowerCase().trim();

        // 先检查缓存
        if (definitionCache.has(normalized)) {
            return definitionCache.get(normalized)!;
        }

        // 从词典数据查找
        const definition = lookupDefinition(normalized);
        if (definition) {
            const frequency = getFrequencyRank(normalized);
            const difficulty = this.estimateDifficultyFromFrequency(frequency);
            const result: WordDefinition = {
                word: normalized,
                definition: definition,
                isCommon: isCommonWord(normalized),
                frequency: frequency > 0 ? frequency : undefined,
                difficulty,
            };
            definitionCache.set(normalized, result);
            return result;
        }

        return null;
    },

    lookupMany(words: string[]): Map<string, WordDefinition> {
        const result = new Map<string, WordDefinition>();

        for (const word of words) {
            const def = this.lookup(word);
            if (def) {
                result.set(word.toLowerCase(), def);
            }
        }

        return result;
    },

    isCommonWord(word: string): boolean {
        return isCommonWord(word);
    },

    /**
     * 使用阈值检查是否为常用词
     */
    isCommonWordWithThreshold(word: string, threshold: number): boolean {
        return isCommonWordWithThreshold(word, threshold);
    },

    getLemma(word: string): string {
        return getLemma(word);
    },

    shouldSkipWord(word: string): boolean {
        return shouldSkipWordBase(word);
    },

    /**
     * 根据词频评估难度（1-6）
     */
    estimateDifficultyFromFrequency(freqRank: number): number {
        if (freqRank <= 0) return 5;  // 不在词频表中，视为较难
        if (freqRank <= 1000) return 1;
        if (freqRank <= 3000) return 2;
        if (freqRank <= 6000) return 3;
        if (freqRank <= 10000) return 4;
        if (freqRank <= 20000) return 5;
        return 6;
    },

    /**
     * 评估单词难度（基于词频）
     * @deprecated 使用 estimateDifficultyFromFrequency 替代
     */
    estimateWordDifficulty(word: string): number {
        if (!word || typeof word !== 'string') return 1;
        const w = word.toLowerCase().trim();

        const frequency = getFrequencyRank(w);
        return this.estimateDifficultyFromFrequency(frequency);
    },

    /**
     * 分析文本中的生词
     *
     * 注意：此方法保留是为了兼容旧代码
     * 推荐使用 VocabAnnotationService.annotateText() 获取更精确的结果
     */
    async analyzeText(
        text: string,
        userKnownWords?: Set<string>,
        minDifficulty: number = 3
    ): Promise<{
        words: { word: string; isNew: boolean; definition?: string; difficulty?: number; frequency?: number }[];
        sentences: string[];
        newWordsCount: number;
        knownWordsCount: number;
    }> {
        const wordMatches = text.match(/\b[a-zA-Z]+(?:['-][a-zA-Z]+)?\b/g) || [];
        const uniqueWords = [...new Set(wordMatches.filter(w => typeof w === 'string').map(w => w.toLowerCase()))];

        const words: { word: string; isNew: boolean; definition?: string; difficulty?: number; frequency?: number }[] = [];
        let newWordsCount = 0;
        let knownWordsCount = 0;

        const knownWords = userKnownWords || new Set();

        // 使用词频表过滤，不再使用硬编码的 basicWords
        const DEFAULT_THRESHOLD = 5000;  // 默认阈值

        const candidateWords = uniqueWords.filter(word => {
            if (!word || typeof word !== 'string' || word.length <= 2) return false;
            if (shouldSkipWordBase(word)) return false;
            if (knownWords.has(word)) return false;
            return true;
        });

        console.log('[Dictionary] 候选词:', candidateWords.length, '个');

        // 批量检查常用词
        const commonWordResults = batchCheckCommonWordsWithThreshold(candidateWords, DEFAULT_THRESHOLD);

        for (const word of candidateWords) {
            if (!word || typeof word !== 'string') continue;

            const isCommon = commonWordResults.get(word) || false;

            if (isCommon) {
                words.push({ word, isNew: false, difficulty: 1 });
                knownWordsCount++;
                continue;
            }

            // 获取词频和难度
            const frequency = getFrequencyRank(word);
            const difficulty = this.estimateDifficultyFromFrequency(frequency);
            const isNew = difficulty >= minDifficulty;
            const def = this.lookup(word);

            if (!def) {
                // 无释义，跳过
                continue;
            }

            words.push({
                word,
                isNew,
                definition: def.definition,
                difficulty,
                frequency: frequency > 0 ? frequency : undefined,
            });

            if (isNew) {
                newWordsCount++;
            } else {
                knownWordsCount++;
            }
        }

        // 提取句子
        const sentenceMatches = text.match(/[^.!?]+[.!?]+/g) || [];
        const sentences = sentenceMatches.map(s => s.trim()).filter(s => s.length > 10);

        return {
            words,
            sentences,
            newWordsCount,
            knownWordsCount,
        };
    },

    search(prefix: string, limit: number = 10): WordDefinition[] {
        const normalizedPrefix = prefix.toLowerCase().trim();
        const results: WordDefinition[] = [];

        return results.slice(0, limit);
    },

    preloadDefinitions(definitions: Array<{ word: string; definition: string; phonetic?: string }>): void {
        for (const item of definitions) {
            const normalized = item.word.toLowerCase();
            const frequency = getFrequencyRank(normalized);
            const difficulty = this.estimateDifficultyFromFrequency(frequency);
            definitionCache.set(normalized, {
                word: normalized,
                phonetic: item.phonetic,
                definition: item.definition,
                isCommon: isCommonWord(normalized),
                frequency: frequency > 0 ? frequency : undefined,
                difficulty,
            });
        }
    },

    clearCache(): void {
        definitionCache.clear();
    },
};
