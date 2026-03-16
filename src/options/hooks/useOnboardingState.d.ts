import type { BaitConfig } from "../../shared/types.ts";
export interface OnboardingInfo {
    hasApi: boolean;
    hasData: boolean;
    pendingCount: number;
    loading: boolean;
}
export declare function useOnboardingState(db: IDBDatabase | null, config: BaitConfig, configLoading: boolean): OnboardingInfo;
