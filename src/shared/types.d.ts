/** llm-adapter 内部使用的扁平格式（从 provider 推导） */
export interface LLMConfig {
    format: "gemini" | "openai-compatible";
    apiKey: string;
    baseUrl: string;
    model: string;
}
/** 5 种 Provider */
export type ProviderKey = "gemini" | "chatgpt" | "deepseek" | "qwen" | "kimi";
/** 单个 Provider 的存储数据 */
export interface ProviderConfig {
    apiKey: string;
    model: string;
}
/** 多 Provider 存储结构 */
export interface LLMMultiConfig {
    activeProvider: ProviderKey;
    providers: Record<ProviderKey, ProviderConfig>;
}
export interface BaitConfig {
    llm: LLMMultiConfig;
    sensitivity: number;
    scanThreshold: "short" | "medium" | "long";
    chunkGranularity: "coarse" | "medium" | "fine";
    chunkIntensity: number;
    disabledSites: string[];
}
export declare const DEFAULT_PROVIDERS: Record<ProviderKey, ProviderConfig>;
export declare const DEFAULT_CONFIG: BaitConfig;
/** Provider 元数据（format / baseUrl 是常量，从 provider 名推导） */
export declare const PROVIDER_META: Record<ProviderKey, {
    format: LLMConfig["format"];
    baseUrl: string;
    label: string;
}>;
/** 从多 Provider 配置中解析出 LLMConfig（给 llm-adapter 用） */
export declare function resolveLLMConfig(multi: LLMMultiConfig): LLMConfig;
/** 旧格式升级到新格式（向后兼容） */
export declare function migrateLLMConfig(raw: unknown): LLMMultiConfig;
export type Message = {
    type: "chunk";
    sentences: string[];
    source_url?: string;
} | {
    type: "hasApiKey";
} | {
    type: "getConfig";
} | {
    type: "updateConfig";
    config: Partial<BaitConfig>;
} | {
    type: "checkActive";
} | {
    type: "toggleSite";
    hostname: string;
} | {
    type: "pauseTab";
    tabId: number;
} | {
    type: "resumeTab";
    tabId: number;
} | {
    type: "getTabState";
    tabId: number;
    hostname: string;
} | {
    type: "saveSentence";
    text: string;
    source_url: string;
    source_hostname: string;
    manual: boolean;
    new_words: string[];
} | {
    type: "analyzeSentences";
    sentenceIds: string[];
};
export type BackgroundMessage = {
    type: "activate";
} | {
    type: "deactivate";
} | {
    type: "pause";
} | {
    type: "resume";
} | {
    type: "sentenceAnalyzed";
    pendingId: string;
    learningRecord: LearningRecord;
} | {
    type: "sentenceAnalysisFailed";
    pendingId: string;
    error: string;
};
export interface ChunkResult {
    original: string;
    chunked: string;
    isSimple: boolean;
    newWords: {
        word: string;
        definition: string;
    }[];
    sentenceAnalysis?: string;
    expressionTips?: string;
}
export interface CacheEntry {
    hash: string;
    result: ChunkResult;
    timestamp: number;
}
export declare const CACHE_TTL: number;
export interface FullAnalysisResult {
    chunked: string;
    pattern_key: string;
    sentence_analysis: string;
    expression_tips: string;
    new_words: {
        word: string;
        definition: string;
    }[];
    is_worth_practicing: boolean;
}
/** 生词状态 */
export type VocabStatus = "new" | "learning" | "mastered";
/** vocab — 生词表 */
export interface VocabRecord {
    id: string;
    word: string;
    status: VocabStatus;
    phonetic?: string;
    definition?: string;
    encounter_count: number;
    first_seen_at: number;
    mastered_at?: number;
    updated_at: number;
    is_dirty: boolean;
}
/** vocab_contexts — 生词出处（每次遭遇记一条） */
export interface VocabContextRecord {
    id: string;
    vocab_id: string;
    sentence: string;
    context_definition: string;
    source_url: string;
    created_at: number;
    updated_at: number;
    is_dirty: boolean;
}
/** 句式类型 key（与 PRD 对齐） */
export type PatternKey = "insertion" | "background_first" | "nested" | "long_list" | "inverted" | "long_subject" | "omission" | "contrast" | "condition" | "long_modifier" | "other";
/** patterns — 句式类型 */
export interface PatternRecord {
    id: string;
    key: PatternKey;
    count: number;
    updated_at: number;
    is_dirty: boolean;
}
/** pattern_examples — 句式实例 */
export interface PatternExampleRecord {
    id: string;
    pattern_id: string;
    sentence: string;
    chunked: string;
    explanation?: string;
    source_url?: string;
    created_at: number;
    updated_at: number;
    is_dirty: boolean;
}
/** learning_records — 阅读记录（只记 LLM 处理过的复杂句子） */
export interface LearningRecord {
    id: string;
    sentence: string;
    chunked: string;
    sentence_analysis?: string;
    expression_tips?: string;
    pattern_key?: PatternKey;
    new_words: {
        word: string;
        definition: string;
    }[];
    source_url?: string;
    llm_provider?: string;
    tokens_used?: number;
    created_at: number;
    updated_at: number;
    is_dirty: boolean;
}
/** settings — 键值对设置（学习系统用） */
export interface SettingsRecord {
    key: string;
    value: unknown;
    updated_at: number;
    is_dirty: boolean;
}
/** weekly_reports — 周报缓存 */
export interface WeeklyReportRecord {
    id: string;
    week_start: string;
    content: string;
    stats: {
        total_sentences: number;
        total_new_words: number;
        pattern_distribution: Record<string, number>;
        top_words: {
            word: string;
            count: number;
        }[];
    };
    created_at: number;
    updated_at: number;
    is_dirty: boolean;
}
/** review_items — 间隔重复队列（SM-2 算法） */
export interface ReviewItemRecord {
    id: string;
    type: "sentence" | "word";
    reference_id: string;
    ease_factor: number;
    interval: number;
    repetitions: number;
    next_review_at: number;
    last_reviewed_at?: number;
    created_at: number;
    updated_at: number;
    is_dirty: boolean;
}
/** wallpaper_records — 壁纸生成记录 */
export interface WallpaperRecord {
    id: string;
    sentence: string;
    image_data?: string;
    style?: string;
    created_at: number;
    updated_at: number;
    is_dirty: boolean;
}
/** pending_sentences — 待分析句子（浏览时静默采集） */
export interface PendingSentenceRecord {
    id: string;
    text: string;
    source_url: string;
    source_hostname: string;
    manual: boolean;
    new_words: string[];
    analyzed: boolean;
    created_at: number;
    updated_at: number;
    is_dirty: boolean;
}
