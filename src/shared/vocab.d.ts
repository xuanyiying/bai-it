/**
 * 生词标注系统
 *
 * 词汇源：
 * 1. 通用离线词典（ECDICT 31K 词条）— 基础释义
 * 2. AI 语境化释义 — 仅在调 AI 时获得
 *
 * 过滤规则：
 * - 常用词（ECDICT BNC/FRQ ≤ 5000）不标注
 * - 词形变体还原到原形后判断（ECDICT exchange 字段）
 * - 用户已标记"已掌握"的词不标注
 * - 太短的词（< 3 字母）不标注
 */
export interface VocabAnnotation {
    word: string;
    definition: string;
}
/**
 * 初始化词频表
 * @param words 常用词数组
 */
export declare function loadFrequencyList(words: string[]): void;
/**
 * 初始化通用词典
 * @param entries word → definition 映射对象
 */
export declare function loadDictionary(entries: Record<string, string>): void;
/**
 * 初始化词形映射表（variant → base form）
 * @param entries variant → base 映射对象
 */
export declare function loadLemmaMap(entries: Record<string, string>): void;
/**
 * 检查数据是否已加载
 */
export declare function isLoaded(): boolean;
/**
 * 获取词的原形候选（通过 lemma 映射表 + 简单后缀规则兜底）
 *
 * 优先用 ECDICT exchange 字段生成的 lemma 映射（准确），
 * 如果映射表没有，用简单后缀规则兜底（覆盖常见变形）。
 */
export declare function getStemCandidates(word: string): string[];
/** 检查是否为常用词（含词形变体） */
export declare function isCommonWord(word: string): boolean;
/**
 * 标注文本中的生词
 *
 * @param text 要标注的文本
 * @param knownWords 用户已掌握的词（Set<lowercase word>）
 * @returns 需要标注的生词及释义
 */
export declare function annotateWords(text: string, knownWords: Set<string>): VocabAnnotation[];
/**
 * 将 VocabAnnotation[] 转为 ChunkResult.newWords 格式
 */
export declare function toNewWordsFormat(annotations: VocabAnnotation[]): {
    word: string;
    definition: string;
}[];
export declare function resetAll(): void;
