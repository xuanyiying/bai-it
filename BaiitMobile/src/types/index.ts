// ========== AI 配置 ==========

/** AI 配置 */
export interface AIConfig {
  format: "gemini" | "openai-compatible";
  apiKey: string;
  baseUrl: string;
  model: string;
}

/** 用户 AI 配置 */
export interface UserAIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

/** 内置 AI 配置（从环境变量读取） */
export interface BuiltInAIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

/** AI 配置存储结构 */
export interface AIStorageConfig {
  useBuiltIn: boolean;  // 是否使用内置配置
  userConfig?: UserAIConfig;  // 用户自定义配置
}

// ========== 插件配置 ==========

export interface BaitConfig {
  AI: AIStorageConfig;
  sensitivity: number;
  scanThreshold: "short" | "medium" | "long";
  chunkGranularity: "coarse" | "medium" | "fine";
  chunkIntensity: number;
  disabledSites: string[];
}

export const DEFAULT_CONFIG: BaitConfig = {
  AI: {
    useBuiltIn: true,
  },
  sensitivity: 3,
  scanThreshold: "medium",
  chunkGranularity: "fine",
  chunkIntensity: 5,
  disabledSites: [],
};

/** 内置 AI 配置（从环境变量读取，不硬编码） */
export const BUILT_IN_AI_CONFIG: BuiltInAIConfig | null = null;

/** 解析最终 AI 配置 */
export function resolveAIConfig(config: AIStorageConfig): AIConfig | null {
  if (config.useBuiltIn && BUILT_IN_AI_CONFIG) {
    return {
      format: "openai-compatible",
      apiKey: BUILT_IN_AI_CONFIG.apiKey,
      baseUrl: BUILT_IN_AI_CONFIG.baseUrl,
      model: BUILT_IN_AI_CONFIG.model,
    };
  }

  if (config.userConfig?.apiKey) {
    return {
      format: "openai-compatible",
      apiKey: config.userConfig.apiKey,
      baseUrl: config.userConfig.baseUrl,
      model: config.userConfig.model,
    };
  }

  return null;
}

/** 检查是否配置了有效的 AI */
export function hasValidAIConfig(config: AIStorageConfig): boolean {
  if (config.useBuiltIn && BUILT_IN_AI_CONFIG?.apiKey) {
    return true;
  }
  return !!config.userConfig?.apiKey;
}

// ========== Content Script ↔ Service Worker 消息 ==========

export type Message =
  | { type: "chunk"; sentences: string[]; source_url?: string }
  | { type: "hasApiKey" }
  | { type: "getConfig" }
  | { type: "updateConfig"; config: Partial<BaitConfig> }
  | { type: "checkActive" }
  | { type: "toggleSite"; hostname: string }
  | { type: "pauseTab"; tabId: number }
  | { type: "resumeTab"; tabId: number }
  | { type: "getTabState"; tabId: number; hostname: string }
  | { type: "saveSentence"; text: string; source_url: string; source_hostname: string; manual: boolean; new_words: string[] }
  | { type: "analyzeSentences"; sentenceIds: string[] };

export type BackgroundMessage =
  | { type: "activate" }
  | { type: "deactivate" }
  | { type: "chunkResult"; results: ChunkResult[] }
  | { type: "hasApiKey"; value: boolean }
  | { type: "config"; config: BaitConfig }
  | { type: "siteStatus"; hostname: string; isDisabled: boolean }
  | { type: "tabState"; isPaused: boolean; isDisabled: boolean }
  | { type: "sentenceSaved"; success: boolean };

// ========== AI 分析结果 ==========

export interface ChunkResult {
  index: number;
  original: string;
  chunked: string;
  is_simple: boolean;
  new_words: { word: string; definition: string }[];
}

export interface FullAnalysisResult {
  chunked: string;
  is_simple: boolean;
  new_words: { word: string; definition: string }[];
  structure?: string;
  sentence_analysis?: string;
  expression_tips?: string;
  pattern_key?: string;
  is_worth_practicing?: boolean;
}

// ========== 词汇相关类型 ==========

export type MobileVocabStatus = 'new' | 'learning' | 'mastered';

export interface MobileVocabRecord {
  id: string;
  word: string;
  phonetic?: string;
  definition: string;
  status: MobileVocabStatus;
  addedAt: string;
  lastReviewed?: string;
  reviewCount: number;
  sourceUrl?: string;
  encounterCount?: number;
  firstSeenAt?: string;
  updatedAt?: string;
  masteredAt?: string;
}

export interface MobileVocabContextRecord {
  id: string;
  vocabId: string;
  sentence: string;
  translation?: string;
  sourceUrl?: string;
  createdAt: string;
}

// ========== 句子相关类型 ==========

export interface MobileSavedSentence {
  id: string;
  text: string;
  translation?: string;
  sourceUrl?: string;
  sourceHostname?: string;
  sourceApp?: string;
  savedAt: string;
  createdAt: string;
  updatedAt?: string;
  isAnalyzed: boolean;
  newWords: string[];
  words: string[];
  analysisResult?: {
    chunked?: string;
    structure?: string;
    sentenceAnalysis?: string;
    expressionTips?: string;
    newWords?: { word: string; definition: string }[];
  };
}

export interface MobileSentenceAnalysis {
  id: string;
  sentenceId: string;
  chunked: string;
  structure?: string;
  sentence_analysis?: string;
  expression_tips?: string;
  newWords: { word: string; definition: string }[];
  analyzedAt: string;
}

// ========== 学习记录类型 ==========

export interface MobileLearningRecord {
  id: string;
  date: string;
  wordsLearned: number;
  wordsReviewed: number;
  sentencesRead: number;
  timeSpent: number; // 分钟
  newWords?: number;
  reviewedWords?: number;
  masteredWords?: number;
  sentencesCollected?: number;
  studyTimeMinutes?: number;
}

export interface MobileReviewItem {
  id: string;
  vocabId: string;
  nextReview: string;
  nextReviewAt?: string;
  interval: number; // 间隔天数
  easeFactor: number; // 难度系数
  repetitions?: number;
  lastReviewedAt?: string;
}

// ========== 应用统计类型 ==========

export interface MobileAppStats {
  totalWords: number;
  masteredWords: number;
  learningWords: number;
  savedSentences: number;
  analyzedSentences: number;
  streakDays: number;
  lastStudyDate?: string;
  totalStudyTime: number; // 分钟
  currentStreak?: number;
  longestStreak?: number;
  newWords?: number;
  totalSentences?: number;
}

// ========== 缓存相关类型 ==========

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export const CACHE_TTL = {
  VOCAB: 24 * 60 * 60 * 1000, // 1天
  SENTENCE: 7 * 24 * 60 * 60 * 1000, // 7天
  ANALYSIS: 30 * 24 * 60 * 60 * 1000, // 30天
};

// ========== 扫描规则类型 ==========

export type Granularity = 'coarse' | 'medium' | 'fine';

export interface ScanChunk {
  id?: string;
  text: string;
  startIndex?: number;
  endIndex?: number;
  level?: number;
}

export interface ScanChunkResult {
  chunk?: ScanChunk;
  chunks?: ScanChunk[];
  difficulty?: number;
  shouldAnnotate?: boolean;
  needsAI?: boolean;
}

// ========== 单词信息类型 ==========

export interface WordInfo {
  word: string;
  phonetic?: string;
  definition: string;
  difficulty: number;
  frequency: number;
  isNew?: boolean;
}

// ========== 数据库记录类型（兼容旧代码） ==========

export type VocabStatus = MobileVocabStatus;
export type VocabRecord = MobileVocabRecord;
export type VocabContextRecord = MobileVocabContextRecord;
export type SavedSentence = MobileSavedSentence;
export type SentenceAnalysis = MobileSentenceAnalysis;
export type LearningRecord = MobileLearningRecord;
export type ReviewItem = MobileReviewItem;
export type AppStats = MobileAppStats;

// ========== 旧版兼容类型 ==========

/** @deprecated 使用 AIStorageConfig 替代 */
export type AIMultiConfig = AIStorageConfig;

/** @deprecated 使用 SavedSentence 替代 */
export type MobileSavedSentenceRecord = MobileSavedSentence;

/** @deprecated 使用 MobileSentenceAnalysis 替代 */
export type SentenceAnalysisRecord = MobileSentenceAnalysis;

// ========== utils/db.ts 兼容类型 ==========

/** @deprecated 使用 VocabRecord 替代 */
export type PatternRecord = VocabRecord;

/** @deprecated 使用 VocabContextRecord 替代 */
export type PatternExampleRecord = VocabContextRecord;

/** @deprecated 使用 BaitConfig 替代 */
export type SettingsRecord = BaitConfig;

/** @deprecated 使用 LearningRecord 替代 */
export type WeeklyReportRecord = LearningRecord;

/** @deprecated 使用 ReviewItem 替代 */
export type ReviewItemRecord = ReviewItem;

/** @deprecated 使用 VocabRecord 替代 */
export type WallpaperRecord = VocabRecord;

/** @deprecated 使用 SavedSentence 替代 */
export type PendingSentenceRecord = SavedSentence;

// ========== 扫描结果类型 ==========

export interface ScanResult {
  id: string;
  text: string;
  words: WordInfo[];
  sentences: string[];
  timestamp: number;
  source?: string;
}
