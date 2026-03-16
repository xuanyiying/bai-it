interface MasteredWordsContextValue {
    masteredWords: Set<string>;
    toggleMastered: (word: string) => void;
}
export declare const MasteredWordsContext: any;
export declare function useMasteredWordsProvider(db: IDBDatabase | null): {
    masteredWords: any;
    toggleMastered: any;
};
export declare function useMasteredWords(): MasteredWordsContextValue;
export {};
