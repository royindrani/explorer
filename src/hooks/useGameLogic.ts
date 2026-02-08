import { useState, useEffect, useCallback } from 'react';
import { generatePuzzle, isValidWord, findShortestPath } from '../utils/ladderLogic';



export type GameStatus = 'loading' | 'playing' | 'won' | 'lost';

export const useGameLogic = () => {
    const [startWord, setStartWord] = useState('');
    const [endWord, setEndWord] = useState('');
    const [ladder, setLadder] = useState<string[]>(Array(5).fill(''));
    const [currentRow, setCurrentRow] = useState(0);
    const [status, setStatus] = useState<GameStatus>('loading');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [startTime, setStartTime] = useState<number>(0);
    const [endTime, setEndTime] = useState<number>(0);

    const initGame = useCallback(() => {
        setStatus('loading');
        setTimeout(() => {
            // Generate puzzle between 3 and 5 steps
            const { start, end } = generatePuzzle(3, 5);
            setStartWord(start);
            setEndWord(end);
            setLadder(Array(5).fill(''));
            setCurrentRow(0);
            setStatus('playing');
            setStartTime(Date.now());
            setEndTime(0);
        }, 100);
    }, []);

    useEffect(() => {
        initGame();
    }, [initGame]);

    const handleInput = (word: string) => {
        if (status !== 'playing') return;

        setErrorMsg(null);
        const newLadder = [...ladder];
        newLadder[currentRow] = word;
        setLadder(newLadder);
    };

    const submitRow = () => {
        if (status !== 'playing') return;

        const currentWord = ladder[currentRow];

        if (currentWord.length !== 5) {
            triggerError("Not enough letters");
            return;
        }

        if (!isValidWord(currentWord)) {
            triggerError("Not in word list");
            return;
        }

        // Validate "One Letter Change"
        const prevWord = currentRow === 0 ? startWord : ladder[currentRow - 1];

        // Exact 1 char diff
        let diffCount = 0;
        for (let i = 0; i < 5; i++) {
            if (prevWord[i] !== currentWord[i]) diffCount++;
        }

        if (diffCount === 0) {
            triggerError("Enter a new word");
            return;
        }
        if (diffCount > 1) {
            triggerError("Change exactly one letter");
            return;
        }

        // Check for Win (Early or Final)
        if (currentWord === endWord) {
            setStatus('won');
            setEndTime(Date.now());
            return;
        }

        // If we are at the last row (index 4) and haven't won yet (checked above), logic depends.
        // User says: "Pop of try again should only be shown if the user enters a word on the 5th step that is not the target word."
        // AND "User should be able to reach start word to target word in 5 steps or less."
        // Wait, if I am at row 4 (5th step), and I submit a valid word that is NOT the endWord...
        // AND validation says "Intermediate steps must be one-off".
        // Does the 5th word HAVE to be the end word?
        // User says: "The 5th step is the final step."
        // So if I am at step 5, I MUST transform to the Target.
        // My previous code checked `isOneOff(currentWord, endWord)` at step 4.
        // But the user implies the 5th word *IS* the attempt to match the target.
        // So validation is:
        // 1. Is it a valid dictionary word? (Already checked)
        // 2. Is it 1-off from previous? (Already checked)
        // 3. If it's the 5th word, IS it the target?
        // Checks:

        if (currentRow === 4) {
            // We already checked (currentWord === endWord) above.
            // If we are here, it means currentWord != endWord.
            // So they lost.
            setStatus('lost');
        } else {
            setCurrentRow(c => c + 1);
        }
    };

    const triggerError = (msg: string) => {
        setErrorMsg(msg);
        setTimeout(() => setErrorMsg(null), 2000);
    };

    const clearLadder = () => {
        setLadder(Array(5).fill(''));
        setCurrentRow(0);
        setStatus('playing');
        setErrorMsg(null);
    };

    const getHint = () => {
        if (status !== 'playing') return;

        const prevWord = currentRow === 0 ? startWord : ladder[currentRow - 1];
        const path = findShortestPath(prevWord, endWord);

        if (path && path.length > 1) {
            // path[0] is start (prevWord), path[1] is the next step
            const nextWord = path[1];
            handleInput(nextWord);
        } else {
            triggerError("No connection found!");
        }
    };

    // Calculate optimal steps for the current start/end
    // We can do this on the fly or memoize it. Start/End don't change often.
    const getOptimalSteps = () => {
        const path = findShortestPath(startWord, endWord);
        return path ? path.length - 1 : 5; // -1 because path includes start
    };

    return {
        startWord,
        endWord,
        ladder,
        currentRow,
        status,
        errorMsg,
        handleInput,
        submitRow,
        resetGame: initGame,
        clearLadder,
        getHint,
        elapsedTime: endTime && startTime ? (endTime - startTime) / 1000 : 0,
        optimalSteps: getOptimalSteps()
    };
};
