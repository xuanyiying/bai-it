import type { LearningRecord, VocabRecord } from "../../shared/types.ts";
export interface ReviewData {
    /** Today's sentence for break-point practice (prioritize "valuable" ones) */
    practiseSentence: LearningRecord | null;
    /** Today's vocab words (from learning records) */
    todayVocab: (VocabRecord & {
        encounterToday: number;
    })[];
    /** This week's sentence count */
    weekSentenceCount: number;
    loading: boolean;
}
export declare function useReviewData(db: IDBDatabase | null, isExample?: boolean): ReviewData;
