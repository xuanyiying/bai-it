interface BreakPointSentenceProps {
    sentence: string;
    onBreakCountChange?: (count: number) => void;
}
/**
 * 裸句中可点击位置插入/移除竖线断点
 * 断点位置：每个单词之间（空格处）
 */
export declare function BreakPointSentence({ sentence, onBreakCountChange }: BreakPointSentenceProps): any;
export {};
