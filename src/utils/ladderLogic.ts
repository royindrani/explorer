import { VALID_WORDS as WORD_LIST, COMMON_WORDS } from './wordList';

export const isOneOff = (word1: string, word2: string): boolean => {
    if (word1.length !== word2.length) return false;
    let diffCount = 0;
    for (let i = 0; i < word1.length; i++) {
        if (word1[i] !== word2[i]) {
            diffCount++;
            if (diffCount > 1) return false;
        }
    }
    return diffCount === 1;
};

export const isValidWord = (word: string): boolean => {
    return WORD_LIST.includes(word.toLowerCase());
};

// BFS to find the shortest path between start and end
export const findShortestPath = (start: string, end: string): string[] | null => {
    if (start === end) return [start];

    const queue: string[][] = [[start]];
    const visited = new Set<string>([start]);

    while (queue.length > 0) {
        const path = queue.shift()!;
        const current = path[path.length - 1];

        if (current === end) {
            return path;
        }

        // Optimization: filtering WORD_LIST is O(N). 
        for (const word of WORD_LIST) {
            if (!visited.has(word) && isOneOff(current, word)) {
                visited.add(word);
                queue.push([...path, word]);
            }
        }
    }
    return null;
};

// BFS to find all words at exact distance N from start
export const generatePuzzle = (minDist: number = 3, maxDist: number = 5): { start: string; end: string } => {
    let start = '';
    let end = '';
    let found = false;

    // Use Common Words list if available, otherwise fallback
    const sourceList = (COMMON_WORDS && COMMON_WORDS.length > 0) ? COMMON_WORDS : WORD_LIST;

    // Safety: prevent infinite loops
    let attempts = 0;
    while (!found && attempts < 50) {
        attempts++;
        start = sourceList[Math.floor(Math.random() * sourceList.length)];

        // Modified BFS: Prioritize common-word neighbors to find an "intuitive" path
        let queue: { word: string, dist: number }[] = [{ word: start, dist: 0 }];
        let visited = new Set<string>([start]);
        let candidates: string[] = [];

        let idx = 0;
        while (idx < queue.length) {
            const { word, dist } = queue[idx];
            idx++;

            if (dist >= minDist && dist <= maxDist) {
                if (sourceList.includes(word)) {
                    candidates.push(word);
                }
            }

            if (dist < maxDist) {
                // Find all possible one-off words
                const neighbors = WORD_LIST.filter(w => !visited.has(w) && isOneOff(word, w));

                // Sort neighbors: Put common words first to increase likelihood of a "common" path
                neighbors.sort((a, b) => {
                    const aCommon = sourceList.includes(a);
                    const bCommon = sourceList.includes(b);
                    if (aCommon && !bCommon) return -1;
                    if (!aCommon && bCommon) return 1;
                    return 0;
                });

                for (const w of neighbors) {
                    visited.add(w);
                    queue.push({ word: w, dist: dist + 1 });
                }
            }
        }

        if (candidates.length > 0) {
            end = candidates[Math.floor(Math.random() * candidates.length)];
            found = true;
        }
    }

    // Fallback if tight constraints fail
    if (!found) {
        // Just return any two random common words that have a path? 
        // Or retry. 50 attempts should suffice.
        return { start: sourceList[0], end: sourceList[1] };
    }

    return { start, end };
};
