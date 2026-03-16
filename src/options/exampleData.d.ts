import type { DashboardData } from "./hooks/useDashboardData.ts";
import type { ReviewData } from "./hooks/useReviewData.ts";
import type { LearningRecord, PatternKey } from "../shared/types.ts";
export declare const EXAMPLE_DASHBOARD: DashboardData;
export declare const EXAMPLE_REVIEW: ReviewData;
export interface ExampleSentencesData {
    records: LearningRecord[];
    availablePatterns: PatternKey[];
}
export declare const EXAMPLE_SENTENCES: ExampleSentencesData;
