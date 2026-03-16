import type { LearningRecord, PendingSentenceRecord } from "../../shared/types.ts";
export type SentenceItem = {
    type: "analyzed";
    record: LearningRecord;
} | {
    type: "pending";
    pending: PendingSentenceRecord;
    analyzing: boolean;
    error?: string;
};
export declare function useSentences(db: IDBDatabase | null, isExample?: boolean): {
    items: any;
    filter: any;
    setFilter: any;
    availablePatterns: any;
    loading: any;
    page: any;
    setPage: any;
    totalPages: any;
    hasNextPage: boolean;
    hasPrevPage: boolean;
};
