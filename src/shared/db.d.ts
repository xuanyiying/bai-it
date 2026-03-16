/**
 * IndexedDB 数据层
 *
 * 9 张表，服务学习系统（Options 页）。
 * 与 cache.ts 的分块缓存互不干扰（不同的 IndexedDB 数据库）。
 *
 * 全局规则：
 * - 主键全部 UUID
 * - 所有表有 updated_at + is_dirty（V2 同步预留）
 * - onupgradeneeded 做 schema 版本管理
 */
import type { VocabRecord, VocabContextRecord, PatternRecord, PatternExampleRecord, LearningRecord, SettingsRecord, WeeklyReportRecord, ReviewItemRecord, WallpaperRecord, PendingSentenceRecord } from "./types.ts";
export declare const DB_NAME = "openen-data";
export declare const DB_VERSION = 2;
export declare const STORES: {
    readonly vocab: "vocab";
    readonly vocab_contexts: "vocab_contexts";
    readonly patterns: "patterns";
    readonly pattern_examples: "pattern_examples";
    readonly learning_records: "learning_records";
    readonly settings: "settings";
    readonly weekly_reports: "weekly_reports";
    readonly review_items: "review_items";
    readonly wallpaper_records: "wallpaper_records";
    readonly pending_sentences: "pending_sentences";
};
export type StoreName = (typeof STORES)[keyof typeof STORES];
export declare function generateId(): string;
export declare function openDB(idb?: IDBFactory): Promise<IDBDatabase>;
/** 关闭连接（测试用） */
export declare function closeDB(): void;
/** 清理缓存的连接引用（测试用，不关闭连接本身） */
export declare function resetDBInstance(): void;
export declare const vocabDAO: {
    add(db: IDBDatabase, data: Omit<VocabRecord, "id" | "encounter_count" | "first_seen_at" | "updated_at" | "is_dirty">): Promise<VocabRecord>;
    getById(db: IDBDatabase, id: string): Promise<VocabRecord | undefined>;
    getByWord(db: IDBDatabase, word: string): Promise<VocabRecord | undefined>;
    getByStatus(db: IDBDatabase, status: string): Promise<VocabRecord[]>;
    getAll(db: IDBDatabase): Promise<VocabRecord[]>;
    update(db: IDBDatabase, id: string, changes: Partial<VocabRecord>): Promise<VocabRecord | undefined>;
    delete(db: IDBDatabase, id: string): Promise<void>;
    /** 记录一次遭遇（encounter_count +1） */
    recordEncounter(db: IDBDatabase, id: string): Promise<VocabRecord | undefined>;
    /** 标记为已掌握 */
    markMastered(db: IDBDatabase, id: string): Promise<VocabRecord | undefined>;
    /** 获取所有已掌握词的 word 集合（Content Script 启动时加载） */
    getMasteredWords(db: IDBDatabase): Promise<Set<string>>;
};
export declare const vocabContextDAO: {
    add(db: IDBDatabase, data: Omit<VocabContextRecord, "id" | "created_at" | "updated_at" | "is_dirty">): Promise<VocabContextRecord>;
    getByVocabId(db: IDBDatabase, vocabId: string): Promise<VocabContextRecord[]>;
    getAll(db: IDBDatabase): Promise<VocabContextRecord[]>;
    delete(db: IDBDatabase, id: string): Promise<void>;
};
export declare const patternDAO: {
    add(db: IDBDatabase, data: Omit<PatternRecord, "id" | "count" | "updated_at" | "is_dirty">): Promise<PatternRecord>;
    getById(db: IDBDatabase, id: string): Promise<PatternRecord | undefined>;
    getByKey(db: IDBDatabase, key: string): Promise<PatternRecord | undefined>;
    getAll(db: IDBDatabase): Promise<PatternRecord[]>;
    update(db: IDBDatabase, id: string, changes: Partial<PatternRecord>): Promise<PatternRecord | undefined>;
    delete(db: IDBDatabase, id: string): Promise<void>;
    /** 增加计数（遇到同类句式时调用） */
    incrementCount(db: IDBDatabase, key: string): Promise<PatternRecord | undefined>;
};
export declare const patternExampleDAO: {
    add(db: IDBDatabase, data: Omit<PatternExampleRecord, "id" | "created_at" | "updated_at" | "is_dirty">): Promise<PatternExampleRecord>;
    getByPatternId(db: IDBDatabase, patternId: string): Promise<PatternExampleRecord[]>;
    getAll(db: IDBDatabase): Promise<PatternExampleRecord[]>;
    delete(db: IDBDatabase, id: string): Promise<void>;
};
export declare const learningRecordDAO: {
    add(db: IDBDatabase, data: Omit<LearningRecord, "id" | "created_at" | "updated_at" | "is_dirty">): Promise<LearningRecord>;
    getById(db: IDBDatabase, id: string): Promise<LearningRecord | undefined>;
    getAll(db: IDBDatabase): Promise<LearningRecord[]>;
    getByPatternKey(db: IDBDatabase, patternKey: string): Promise<LearningRecord[]>;
    getBySourceUrl(db: IDBDatabase, sourceUrl: string): Promise<LearningRecord[]>;
    update(db: IDBDatabase, id: string, changes: Partial<LearningRecord>): Promise<LearningRecord | undefined>;
    delete(db: IDBDatabase, id: string): Promise<void>;
    getBySentence(db: IDBDatabase, sentence: string): Promise<LearningRecord | undefined>;
    /** 按时间范围查询（Dashboard 用） */
    getByDateRange(db: IDBDatabase, startTime: number, endTime: number): Promise<LearningRecord[]>;
};
export declare const settingsDAO: {
    get(db: IDBDatabase, key: string): Promise<unknown | undefined>;
    set(db: IDBDatabase, key: string, value: unknown): Promise<void>;
    delete(db: IDBDatabase, key: string): Promise<void>;
    getAll(db: IDBDatabase): Promise<SettingsRecord[]>;
};
export declare const weeklyReportDAO: {
    add(db: IDBDatabase, data: Omit<WeeklyReportRecord, "id" | "created_at" | "updated_at" | "is_dirty">): Promise<WeeklyReportRecord>;
    getByWeekStart(db: IDBDatabase, weekStart: string): Promise<WeeklyReportRecord | undefined>;
    getAll(db: IDBDatabase): Promise<WeeklyReportRecord[]>;
    update(db: IDBDatabase, id: string, changes: Partial<WeeklyReportRecord>): Promise<WeeklyReportRecord | undefined>;
    delete(db: IDBDatabase, id: string): Promise<void>;
};
export declare const reviewItemDAO: {
    add(db: IDBDatabase, data: Omit<ReviewItemRecord, "id" | "ease_factor" | "interval" | "repetitions" | "created_at" | "updated_at" | "is_dirty">): Promise<ReviewItemRecord>;
    getById(db: IDBDatabase, id: string): Promise<ReviewItemRecord | undefined>;
    getAll(db: IDBDatabase): Promise<ReviewItemRecord[]>;
    getByReferenceId(db: IDBDatabase, refId: string): Promise<ReviewItemRecord[]>;
    /** 获取到期的复习项（next_review_at <= now） */
    getDueItems(db: IDBDatabase, now?: number): Promise<ReviewItemRecord[]>;
    update(db: IDBDatabase, id: string, changes: Partial<ReviewItemRecord>): Promise<ReviewItemRecord | undefined>;
    delete(db: IDBDatabase, id: string): Promise<void>;
    /**
     * SM-2 算法：根据用户评分更新复习计划
     * @param quality 0-5，0-2 = 不记得，3 = 勉强记得，4-5 = 轻松记得
     */
    review(db: IDBDatabase, id: string, quality: number): Promise<ReviewItemRecord | undefined>;
};
export declare const wallpaperRecordDAO: {
    add(db: IDBDatabase, data: Omit<WallpaperRecord, "id" | "created_at" | "updated_at" | "is_dirty">): Promise<WallpaperRecord>;
    getAll(db: IDBDatabase): Promise<WallpaperRecord[]>;
    delete(db: IDBDatabase, id: string): Promise<void>;
};
export declare const pendingSentenceDAO: {
    add(db: IDBDatabase, data: Omit<PendingSentenceRecord, "id" | "analyzed" | "created_at" | "updated_at" | "is_dirty">): Promise<PendingSentenceRecord | null>;
    getById(db: IDBDatabase, id: string): Promise<PendingSentenceRecord | undefined>;
    getByText(db: IDBDatabase, text: string): Promise<PendingSentenceRecord | undefined>;
    getAll(db: IDBDatabase): Promise<PendingSentenceRecord[]>;
    getUnanalyzed(db: IDBDatabase): Promise<PendingSentenceRecord[]>;
    getPage(db: IDBDatabase, page: number, pageSize: number): Promise<{
        records: PendingSentenceRecord[];
        total: number;
    }>;
    markAnalyzed(db: IDBDatabase, id: string): Promise<void>;
    delete(db: IDBDatabase, id: string): Promise<void>;
};
