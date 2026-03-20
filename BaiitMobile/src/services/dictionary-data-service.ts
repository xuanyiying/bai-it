import wordFrequencyData from '../data/word-frequency.json';
import lemmaMapData from '../data/lemma-map.json';
import dictData from '../data/dict-ecdict.json';

type LemmaMap = Record<string, string>;
type DictData = Record<string, string>;

let wordFrequencySet: Set<string> | null = null;
let wordFrequencyArray: string[] | null = null;
let lemmaMap: LemmaMap | null = null;
let commonWordsSet: Set<string> | null = null;
let dictionary: DictData | null = null;
let isInitialized = false;

const COMMON_WORD_THRESHOLD = 5000;

export async function initializeDictionaryData(): Promise<void> {
    if (isInitialized) return;

    const startTime = Date.now();

    wordFrequencyArray = wordFrequencyData as string[];
    wordFrequencySet = new Set(wordFrequencyArray);

    lemmaMap = lemmaMapData as LemmaMap;

    commonWordsSet = new Set(
        (wordFrequencyData as string[]).slice(0, COMMON_WORD_THRESHOLD)
    );

    dictionary = dictData as DictData;

    isInitialized = true;
    console.log(`[DictionaryData] 初始化完成，耗时 ${Date.now() - startTime}ms`);
    console.log(`[DictionaryData] 词频表: ${wordFrequencySet.size} 词`);
    console.log(`[DictionaryData] 词形映射: ${Object.keys(lemmaMap).length} 条`);
    console.log(`[DictionaryData] 常用词: ${commonWordsSet.size} 词`);
    console.log(`[DictionaryData] 词典: ${Object.keys(dictionary).length} 词`);
}

export function lookupDefinition(word: string): string | null {
    if (!dictionary) return null;
    if (!word || typeof word !== 'string') return null;
    return dictionary[word.toLowerCase()] || null;
}

export function isInitialized_complete(): boolean {
    return isInitialized;
}

export function isCommonWord(word: string): boolean {
    if (!commonWordsSet) {
        console.warn('[DictionaryData] 数据未初始化，请先调用 initializeDictionaryData()');
        return word.length <= 3;
    }
    if (!word || typeof word !== 'string') return false;
    const lower = word.toLowerCase();

    // 直接检查
    if (commonWordsSet.has(lower)) return true;

    // 检查词形还原后的原形
    const lemma = getLemma(lower);
    if (lemma !== lower && commonWordsSet.has(lemma)) return true;

    return false;
}

/**
 * 获取词频排名（支持词形还原）
 * 返回 1-based 排名，-1 表示不在词频表中
 */
export function getFrequencyRank(word: string): number {
    if (!wordFrequencyArray || !wordFrequencySet) return -1;
    const lowerWord = word.toLowerCase();

    // 直接查找
    const directIndex = wordFrequencyArray.indexOf(lowerWord);
    if (directIndex >= 0) return directIndex + 1;

    // 查找词形还原后的原形
    const lemma = getLemma(lowerWord);
    if (lemma !== lowerWord) {
        const lemmaIndex = wordFrequencyArray.indexOf(lemma);
        if (lemmaIndex >= 0) return lemmaIndex + 1;
    }

    return -1;
}

/**
 * 根据阈值检查是否为常用词（支持词形还原）
 */
export function isCommonWordWithThreshold(word: string, threshold: number): boolean {
    if (!wordFrequencyArray) return false;
    const rank = getFrequencyRank(word);
    return rank > 0 && rank <= threshold;
}

export function getWordFrequencyRank(word: string): number {
    // 保留旧函数兼容性
    return getFrequencyRank(word);
}

export function getLemma(word: string): string {
    if (!lemmaMap) return word.toLowerCase();
    const lowerWord = word.toLowerCase();
    return lemmaMap[lowerWord] || lowerWord;
}

export function isWordInFrequency(word: string): boolean {
    if (!wordFrequencySet) return false;
    return wordFrequencySet.has(word.toLowerCase());
}

export function getCommonWordsSet(): Set<string> {
    if (!commonWordsSet) {
        return new Set();
    }
    return commonWordsSet;
}

export function getWordFrequencySet(): Set<string> {
    if (!wordFrequencySet) {
        return new Set();
    }
    return wordFrequencySet;
}

export function getLemmaMap(): LemmaMap {
    return lemmaMap || {};
}

export function shouldSkipWord(word: string): boolean {
    const w = word.toLowerCase();

    if (w.length <= 2) return true;

    if (isCommonWord(w)) return true;

    const lemma = getLemma(w);
    if (lemma !== w && isCommonWord(lemma)) return true;

    return false;
}

export function batchGetLemmas(words: string[]): Map<string, string> {
    const result = new Map<string, string>();
    if (!lemmaMap) return result;

    for (const word of words) {
        if (typeof word !== 'string') continue;
        const lowerWord = word.toLowerCase();
        const lemma = lemmaMap[lowerWord];
        if (lemma) {
            result.set(lowerWord, lemma);
        }
    }
    return result;
}

export function batchCheckCommonWords(words: string[]): Map<string, boolean> {
    const result = new Map<string, boolean>();
    if (!commonWordsSet) return result;

    for (const word of words) {
        if (typeof word !== 'string') continue;
        result.set(word.toLowerCase(), isCommonWord(word));
    }
    return result;
}

/**
 * 批量检查常用词（支持阈值）
 */
export function batchCheckCommonWordsWithThreshold(words: string[], threshold: number): Map<string, boolean> {
    const result = new Map<string, boolean>();
    if (!wordFrequencyArray) return result;

    for (const word of words) {
        if (typeof word !== 'string') continue;
        result.set(word.toLowerCase(), isCommonWordWithThreshold(word, threshold));
    }
    return result;
}

/**
 * 批量获取词频排名
 */
export function batchGetFrequencyRanks(words: string[]): Map<string, number> {
    const result = new Map<string, number>();
    if (!wordFrequencyArray) return result;

    for (const word of words) {
        if (typeof word !== 'string') continue;
        result.set(word.toLowerCase(), getFrequencyRank(word));
    }
    return result;
}
