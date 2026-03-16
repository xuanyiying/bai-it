import type { LearningRecord, PendingSentenceRecord } from "../../shared/types.ts";
export interface DashboardData {
    totalSentences: number;
    totalWords: number;
    masteredWords: number;
    recentSentences: LearningRecord[];
    recentPending: PendingSentenceRecord[];
    pendingCount: number;
    loading: boolean;
}
export declare function useDashboardData(db: IDBDatabase | null, isExample?: boolean): DashboardData;
