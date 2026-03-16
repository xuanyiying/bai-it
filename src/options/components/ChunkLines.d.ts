interface ChunkLinesProps {
    chunked: string;
    newWords?: {
        word: string;
        definition: string;
    }[];
}
export declare function ChunkLines({ chunked, newWords }: ChunkLinesProps): any;
export {};
