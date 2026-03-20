/**
 * 移动端生词标注服务
 *
 * 核心逻辑复用浏览器插件 src/shared/vocab.ts
 * 添加用户水平自适应功能
 *
 * 特性：
 * - 根据用户水平动态调整标注阈值
 * - 词形还原后检查词频
 * - 难度评估基于词频而非词长
 */

import {
    initializeDictionaryData,
    isCommonWordWithThreshold,
    getFrequencyRank,
    getLemma,
    lookupDefinition,
    isInitialized_complete,
} from './dictionary-data-service';
import { ProficiencyLevel } from './proficiency-test';

// ========== 类型定义 ==========

export interface VocabAnnotation {
    word: string;
    definition: string;
    difficulty: number;  // 1-6
    isNew: boolean;
    pos?: string;
    phonetic?: string;
    frequency?: number;
}

export interface AnnotationOptions {
    userLevel?: ProficiencyLevel;
    knownWords?: Set<string>;
    minDifficulty?: number;
    customThreshold?: number;  // 自定义阈值，覆盖水平阈值
}

export interface AnnotationResult {
    annotations: VocabAnnotation[];
    stats: {
        totalWords: number;
        annotatedCount: number;
        skippedCommon: number;
        skippedKnown: number;
        threshold: number;
    };
}

// ========== 水平阈值映射 ==========

/**
 * 根据用户水平动态调整词频阈值
 * 阈值越小，标注越少（只标注很罕见的词）
 * 阈值越大，标注越多（包括较常见的词）
 */
const LEVEL_THRESHOLDS: Record<ProficiencyLevel, number> = {
    beginner: 500,           // 标注更多词（词频 > 500 的都标）
    elementary: 1000,        // 词频 > 1000
    intermediate: 2000,      // 默认值
    upper_intermediate: 4000,
    advanced: 8000,
    proficient: 15000,       // 标注更少词（只有很罕见的才标）
};

/**
 * 难度评估的词频分段
 */
const DIFFICULTY_FREQUENCIES = {
    1: 1000,    // 词频 <= 1000: 非常简单
    2: 3000,    // 词频 <= 3000: 简单
    3: 6000,    // 词频 <= 6000: 中等
    4: 10000,   // 词频 <= 10000: 较难
    5: 20000,   // 词频 <= 20000: 难
    // 词频 > 20000: 非常难 (6)
};

// ========== 核心逻辑 ==========

/**
 * 根据词频评估难度（1-6）
 */
export function estimateDifficultyFromFrequency(freqRank: number): number {
    if (freqRank <= 0) return 5;  // 不在词频表中，视为较难
    if (freqRank <= DIFFICULTY_FREQUENCIES[1]) return 1;
    if (freqRank <= DIFFICULTY_FREQUENCIES[2]) return 2;
    if (freqRank <= DIFFICULTY_FREQUENCIES[3]) return 3;
    if (freqRank <= DIFFICULTY_FREQUENCIES[4]) return 4;
    if (freqRank <= DIFFICULTY_FREQUENCIES[5]) return 5;
    return 6;
}

/**
 * 获取用户水平对应的阈值
 */
export function getThresholdForLevel(level: ProficiencyLevel): number {
    return LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS.intermediate;
}

/**
 * 不标注的词：太短、纯数字、含特殊字符
 */
function shouldSkipWord(word: string): boolean {
    if (word.length < 3) return true;
    if (/^\d+$/.test(word)) return true;
    if (/[^a-zA-Z'-]/.test(word)) return true;
    // 跳过英文缩写：don't, won't, I'm, he's, they're 等
    if (word.includes("'")) return true;
    return false;
}

/**
 * 从释义中解析词性和音标
 */
function parseDefinition(def: string): { pos: string; phonetic: string; cleanDef: string } {
    let pos = '';
    let phonetic = '';
    let cleanDef = def || '';

    const posMatch = def?.match(/^(\w+\.)\s*/);
    if (posMatch) {
        pos = posMatch[1];
        cleanDef = cleanDef.replace(/^(\w+\.)\s*/, '');
    }

    const phoneticMatch = def?.match(/(\/[^/]+\/)/);
    if (phoneticMatch) {
        phonetic = phoneticMatch[1];
    }

    return { pos, phonetic, cleanDef };
}

// ========== 主标注函数 ==========

/**
 * 标注文本中的生词
 *
 * @param text 要标注的文本
 * @param options 标注选项
 * @returns 标注结果
 */
export async function annotateText(
    text: string,
    options: AnnotationOptions = {}
): Promise<AnnotationResult> {
    // 确保数据已初始化
    if (!isInitialized_complete()) {
        await initializeDictionaryData();
    }

    const {
        userLevel = 'intermediate',
        knownWords = new Set(),
        minDifficulty = 3,
        customThreshold,
    } = options;

    const threshold = customThreshold ?? getThresholdForLevel(userLevel);

    // 提取所有英文单词
    const wordMatches = text.match(/\b[a-zA-Z][a-zA-Z'-]*[a-zA-Z]\b|\b[a-zA-Z]{3,}\b/g) || [];
    const uniqueWords = [...new Set(wordMatches.map(w => w.toLowerCase()))];

    const stats = {
        totalWords: uniqueWords.length,
        annotatedCount: 0,
        skippedCommon: 0,
        skippedKnown: 0,
        threshold,
    };

    const annotations: VocabAnnotation[] = [];
    const seen = new Set<string>();

    for (const word of uniqueWords) {
        // 去重
        if (seen.has(word)) continue;
        seen.add(word);

        // 跳过条件
        if (shouldSkipWord(word)) continue;

        // 检查用户已掌握
        if (knownWords.has(word)) {
            stats.skippedKnown++;
            continue;
        }

        // 检查是否为常用词（使用动态阈值）
        if (isCommonWordWithThreshold(word, threshold)) {
            stats.skippedCommon++;
            continue;
        }

        // 获取词频和难度
        const freqRank = getFrequencyRank(word);
        const difficulty = estimateDifficultyFromFrequency(freqRank);

        // 检查是否达到最低难度
        if (difficulty < minDifficulty) {
            continue;
        }

        // 查找释义
        const rawDef = lookupDefinition(word);
        if (!rawDef) {
            // 无释义，跳过（不猜测）
            continue;
        }

        const { pos, phonetic, cleanDef } = parseDefinition(rawDef);

        annotations.push({
            word,
            definition: cleanDef,
            difficulty,
            isNew: true,
            pos,
            phonetic,
            frequency: freqRank > 0 ? freqRank : undefined,
        });

        stats.annotatedCount++;
    }

    return { annotations, stats };
}

/**
 * 快速检查单个词是否应该标注
 */
export function shouldAnnotateWord(
    word: string,
    options: AnnotationOptions = {}
): { shouldAnnotate: boolean; reason?: string } {
    const {
        userLevel = 'intermediate',
        knownWords = new Set(),
        customThreshold,
    } = options;

    const lower = word.toLowerCase();

    if (shouldSkipWord(lower)) {
        return { shouldAnnotate: false, reason: 'skipped' };
    }

    if (knownWords.has(lower)) {
        return { shouldAnnotate: false, reason: 'known' };
    }

    const threshold = customThreshold ?? getThresholdForLevel(userLevel);
    if (isCommonWordWithThreshold(lower, threshold)) {
        return { shouldAnnotate: false, reason: 'common' };
    }

    const def = lookupDefinition(lower);
    if (!def) {
        return { shouldAnnotate: false, reason: 'no_definition' };
    }

    return { shouldAnnotate: true };
}

// ========== 批量操作 ==========

/**
 * 批量标注多个文本
 */
export async function annotateTexts(
    texts: string[],
    options: AnnotationOptions = {}
): Promise<AnnotationResult[]> {
    const results: AnnotationResult[] = [];
    const allKnownWords = options.knownWords || new Set();

    for (const text of texts) {
        const result = await annotateText(text, {
            ...options,
            knownWords: allKnownWords,
        });
        results.push(result);

        // 将本次标注的词加入已知词，避免后续重复标注
        for (const annotation of result.annotations) {
            allKnownWords.add(annotation.word);
        }
    }

    return results;
}

// ========== 工具函数 ==========

/**
 * 获取词的详细信息
 */
export function getWordInfo(word: string): {
    word: string;
    lemma: string;
    frequency: number;
    difficulty: number;
    definition: string | null;
    isCommon: boolean;
} {
    const lower = word.toLowerCase();
    const lemma = getLemma(lower);
    const frequency = getFrequencyRank(lower);
    const difficulty = estimateDifficultyFromFrequency(frequency);
    const definition = lookupDefinition(lower);
    const isCommon = isCommonWordWithThreshold(lower, 5000);

    return {
        word: lower,
        lemma,
        frequency,
        difficulty,
        definition,
        isCommon,
    };
}

/**
 * 根据标注数量建议调整阈值
 */
export function suggestThresholdAdjustment(
    annotatedCount: number,
    totalWords: number
): { suggestion: 'increase' | 'decrease' | 'keep'; reason: string } {
    const ratio = totalWords > 0 ? annotatedCount / totalWords : 0;

    if (ratio > 0.3) {
        // 标注超过 30%，建议减少阈值
        return {
            suggestion: 'decrease',
            reason: '标注过多，建议只标注更生僻的词',
        };
    }

    if (ratio < 0.05) {
        // 标注少于 5%，建议增加阈值
        return {
            suggestion: 'increase',
            reason: '标注过少，建议也标注一些常见的生词',
        };
    }

    return {
        suggestion: 'keep',
        reason: '标注密度适中',
    };
}
