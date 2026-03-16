/**
 * 本地规则引擎 — 细读模式复杂度判断
 *
 * 纯 JS 规则判断，毫秒级，零成本。
 * 作用：估算句子的嵌套复杂度，低于用户阈值的句子直接跳过，不调 API。
 *
 * 与旧项目的区别：提高了句子长度的权重（15 词 +1.0，25 词 +1.0，40 词 +1.0），
 * 避免信息密度高但语法简单的长句漏掉。
 */

// 从句标记词
const SUBORDINATE_MARKERS = new Set([
  "that", "which", "who", "whom", "whose", "where", "when",
  "while", "although", "though", "because", "since", "if",
  "unless", "whether", "before", "after", "until", "as",
  "once", "whereas", "whereby", "wherein", "whatever",
  "whoever", "whichever", "however", "whenever", "wherever",
]);

/**
 * 检测文本是否为英文
 * 规则：英文字母(a-z,A-Z)占比超过阈值
 */
export function isEnglish(text: string, threshold = 0.5): boolean {
  if (text.length < 3) return false;
  const letters = text.replace(/[\s\d\p{P}]/gu, "");
  if (letters.length === 0) return false;
  const englishChars = letters.replace(/[^a-zA-Z]/g, "").length;
  return englishChars / letters.length >= threshold;
}

/**
 * 将文本分割成句子
 */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

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
export function estimateComplexity(sentence: string): number {
  const words = sentence.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  // 太短的句子直接返回 1
  if (wordCount < 6) return 1;

  let score = 0;

  // 1. 从句标记词计数
  const lowerWords = words.map(w => w.toLowerCase().replace(/[^a-z']/g, ""));
  let subordinateCount = 0;
  for (const w of lowerWords) {
    if (SUBORDINATE_MARKERS.has(w)) {
      subordinateCount++;
    }
  }
  score += subordinateCount;

  // 2. 句子长度加分（提高权重：每档 +1.0，原来是 +0.5）
  if (wordCount >= 15) score += 1.0;
  if (wordCount >= 25) score += 1.0;
  if (wordCount >= 40) score += 1.0;

  // 3. 标点复杂度
  const commas = (sentence.match(/,/g) || []).length;
  const semicolons = (sentence.match(/;/g) || []).length;
  const dashes = (sentence.match(/[—–-]{2,}|—/g) || []).length;
  const parens = (sentence.match(/[()]/g) || []).length;

  score += Math.min(commas * 0.3, 1.5);
  score += semicolons * 0.5;
  score += dashes * 0.4;
  score += parens * 0.3;

  // 4. 分词结构（-ing/-ed 引导的修饰短语）
  const COMMON_ING = new Set(["being", "going", "doing", "having", "making", "getting", "looking", "something", "nothing", "everything", "anything"]);
  const COMMON_ED = new Set(["used", "based", "called", "named", "said", "asked", "needed", "wanted"]);

  for (let i = 1; i < lowerWords.length; i++) {
    const w = lowerWords[i];
    if (w.endsWith("ing") && w.length > 4 && !COMMON_ING.has(w)) {
      const prev = words[i - 1];
      if (prev.endsWith(",") || i === 1) {
        score += 0.5;
      }
    }
    if (w.endsWith("ed") && w.length > 4 && !COMMON_ED.has(w)) {
      const prev = words[i - 1];
      if (prev.endsWith(",") || i === 1) {
        score += 0.4;
      }
    }
  }

  return Math.max(1, Math.floor(score) + 1);
}

/**
 * 判断句子是否需要 AI 分块（细读模式用）
 */
export function needsChunking(sentence: string, sensitivityLevel: number): boolean {
  if (!isEnglish(sentence)) return false;
  const complexity = estimateComplexity(sentence);
  return complexity >= sensitivityLevel;
}

/**
 * 批量过滤：从一组文本中筛选出需要 AI 处理的句子
 */
export function filterSentences(
  sentences: string[],
  sensitivityLevel: number
): { toProcess: string[]; skipped: string[] } {
  const toProcess: string[] = [];
  const skipped: string[] = [];

  for (const sentence of sentences) {
    if (needsChunking(sentence, sensitivityLevel)) {
      toProcess.push(sentence);
    } else {
      skipped.push(sentence);
    }
  }

  return { toProcess, skipped };
}
