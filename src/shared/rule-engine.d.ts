/**
 * 本地规则引擎 — 细读模式复杂度判断
 *
 * 纯 JS 规则判断，毫秒级，零成本。
 * 作用：估算句子的嵌套复杂度，低于用户阈值的句子直接跳过，不调 API。
 *
 * 与旧项目的区别：提高了句子长度的权重（15 词 +1.0，25 词 +1.0，40 词 +1.0），
 * 避免信息密度高但语法简单的长句漏掉。
 */
/**
 * 检测文本是否为英文
 * 规则：英文字母(a-z,A-Z)占比超过阈值
 */
export declare function isEnglish(text: string, threshold?: number): boolean;
/**
 * 将文本分割成句子
 */
export declare function splitSentences(text: string): string[];
/**
 * 估算句子的嵌套复杂度
 *
 * 返回一个"预估嵌套层数"（1-6+），用于和用户阈值比较。
 *
 * 信号权重：
 * - 从句标记词数量（最重要的信号）
 * - 句子词数（权重已提高）
 * - 标点复杂度
 * - 分词结构（-ing/-ed 引导的修饰短语）
 */
export declare function estimateComplexity(sentence: string): number;
/**
 * 判断句子是否需要 AI 分块（细读模式用）
 */
export declare function needsChunking(sentence: string, sensitivityLevel: number): boolean;
/**
 * 批量过滤：从一组文本中筛选出需要 AI 处理的句子
 */
export declare function filterSentences(sentences: string[], sensitivityLevel: number): {
    toProcess: string[];
    skipped: string[];
};
