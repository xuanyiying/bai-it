interface VocabPillProps {
    word: string;
    definition: string;
    mastered?: boolean;
    onToggleMastered?: () => void;
}
export declare function VocabPill({ word, definition, mastered, onToggleMastered }: VocabPillProps): any;
export {};
