export function createWordSet(words: string[]): Set<string> {
    const set = new Set<string>();
    for (const word of words) {
        set.add(word.toLowerCase());
    }
    return set;
}

export class WordMatcher {
    private wordSet: Set<string>;

    constructor(words: string[]) {
        this.wordSet = new Set<string>();
        for (const word of words) {
            this.wordSet.add(word.toLowerCase());
        }
    }

    has(word: string): boolean {
        return this.wordSet.has(word.toLowerCase());
    }

    getWords(): string[] {
        return Array.from(this.wordSet);
    }
}
