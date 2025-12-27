import { diffArrays } from "diff";

// 1. Text Segmentation
export function splitIntoSentences(text: string): string[] {
    // Use the same robust logic as formatter to split
    // But here we want the array of strings.

    // Strategy: Replace "End of sentence" patterns with a distinctive separator, then split.
    // Pattern: terminator + optional quote + space + (Start of next sentence or End of string)
    // Abbreviations excluded.

    const protectedText = text.replace(
        /(?<!\b(?:a\.m|p\.m|vs|Mr|Ms|Mrs|Dr|e\.g|i\.e))([.!?]['"]?)\s+/g,
        "$1|<SPLIT>|"
    );

    return protectedText.split("|<SPLIT>|").map(s => s.trim()).filter(Boolean);
}

const STOP_WORDS = new Set([
    "a", "an", "the", "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them",
    "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
    "to", "of", "in", "for", "on", "with", "at", "by", "from", "up", "about", "into", "over", "after",
    "and", "but", "or", "so", "if", "because", "as", "until", "while", "that", "this", "these", "those",
    "just", "very", "really", "got", "get", "some", "any", "actually", "basically", "literal", "literally"
]);

function tokenize(text: string): Set<string> {
    // 1. Lowercase and removal of non-alphanumeric (except space)
    const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, "");
    const words = clean.split(/\s+/).filter(Boolean);

    // 2. Stop word removal & Naive stemming
    const tokens = new Set<string>();
    words.forEach(w => {
        if (!STOP_WORDS.has(w)) {
            // Naive stemming: remove 'ing', 'ed', 'es', 's'
            // Order matters: 'ies' -> 'y'? generic 's' last.
            // Let's keep it simple: just remove suffix if length > 3
            let stem = w;
            if (w.length > 3) {
                stem = w.replace(/(?:ing|ed|es|s)$/, "");
            }
            tokens.add(stem);
        }
    });

    // If all words were stop words (e.g. "It is."), return original words to allow strict matching
    if (tokens.size === 0 && words.length > 0) {
        words.forEach(w => tokens.add(w));
    }

    return tokens;
}

// 2. Similarity Metric (0 to 1) using Jaccard on specialized tokens
export function getSimilarity(s1: string, s2: string): number {
    const set1 = tokenize(s1);
    const set2 = tokenize(s2);

    let intersection = 0;
    set1.forEach(w => { if (set2.has(w)) intersection++; });
    // Jaccard = Intersection / Union.
    // Above code was (Inter1 + Inter2) / (Total Words). This is Dice-ish.
    // Let's stick to true Jaccard for Sets.

    let inter = 0;
    set1.forEach(w => { if (set2.has(w)) inter++; });

    const union = new Set([...set1, ...set2]).size;
    if (union === 0) return 1;

    return inter / union;
}

// 3. Alignment Types
export type DiffRow =
    | { type: 'unchanged'; original: string; corrected: string }
    | { type: 'modified'; original: string; corrected: string }
    | { type: 'added'; corrected: string }
    | { type: 'removed'; original: string };

// 4. Needleman-Wunsch like alignment with Merge/Split support
export function alignBlocks(removed: string[], added: string[]): DiffRow[] {
    const N = removed.length;
    const M = added.length;

    // dp[i][j] stores the max score
    const dp: number[][] = Array(N + 1).fill(0).map(() => Array(M + 1).fill(-Infinity));
    // Directions: 1=Diag(1:1), 2=Up(Rem), 3=Left(Add), 4=MergeOrg(2:1), 5=SplitOrg(1:2)
    const ptr: number[][] = Array(N + 1).fill(0).map(() => Array(M + 1).fill(0));

    // Base case
    dp[0][0] = 0;

    // Initialize edges (gaps)
    for (let i = 1; i <= N; i++) dp[i][0] = 0; // standard global align often uses penalties, but we use 0 for "start anywhere" or minimal gap cost style. 
    // Actually for global alignment we should accumulate gap penalties. 
    // But our scoring (sim * 10 or -1) implies a mix. Let's stick to the previous successful pattern but extended.
    // Previous logic: dp[i][0] = 0 means free deletions at start? No, loop `dp[0][j]=0` was correct.
    for (let j = 1; j <= M; j++) dp[0][j] = 0;

    for (let i = 1; i <= N; i++) {
        for (let j = 1; j <= M; j++) {
            // 1. Match 1:1
            const sim11 = getSimilarity(removed[i - 1], added[j - 1]);

            // Heuristic: If similarity is VERY low (<0.1) but they share at least one non-stopword, give it a small boost?
            // Or just trust the threshold. The issue with "Another card" vs "Another one" is Jaccard ~0.2.
            // Let's lower threshold to 0.15. 
            // Warning: This poses a risk of false positives (matching unrelated sentences).
            // However, in a "correction" context, it's safer to assume row i maps to row i if the structure allows it.

            // Refined Scoring:
            // Match (sim > 0.15): Score = +sim * 10 (Range: 1.5 to 10)
            // Mismatch: Score = -3 (Make mismatch costly so we prefer gaps if it's truly rubbish)
            // Gap: Score = -2.0 (Strong penalty to avoid orphans!)

            // This way: 
            // - Good Match (sim 0.5) = +5. Better than Gap (-2.0).
            // - Weak Match (sim 0.2) = +2. Better than Gap (-2.0).
            // - Terrible Match (sim 0.0) = -3. Worse than Gap (-2.0) -> Split.
            // But Merge (2:1) might result in Sim 0.4 (Score 4) vs Match (5) + Gap (-2) = 3. 
            // So 4 > 3 -> Merge wins.

            const gapPenalty = -3.0;
            let matchScore = -3;

            if (sim11 > 0.15) {
                matchScore = sim11 * 10;
            } else {
                // Even if sim is 0, if they are the "only" elements left or purely positional?
                // No, let's rely on overlap. 0.15 is very low.
                matchScore = -3;
            }

            const score11 = dp[i - 1][j - 1] + matchScore;

            // 2. Remove (Gap in Added)
            const scoreRem = dp[i - 1][j] + gapPenalty;

            // 3. Add (Gap in Original)
            const scoreAdd = dp[i][j - 1] + gapPenalty;

            // 4. Merge Original 2:1 (Original[i-2] + Original[i-1] ~= Added[j-1])
            let score21 = -Infinity;
            if (i >= 2) {
                const mergedOrg = removed[i - 2] + " " + removed[i - 1];
                const sim21 = getSimilarity(mergedOrg, added[j - 1]);
                score21 = dp[i - 2][j - 1] + (sim21 > 0.15 ? sim21 * 10 : -3);
            }

            // 5. Split Original 1:2 (Original[i-1] ~= Added[j-2] + Added[j-1])
            let score12 = -Infinity;
            if (j >= 2) {
                const mergedAdd = added[j - 2] + " " + added[j - 1];
                const sim12 = getSimilarity(removed[i - 1], mergedAdd);
                score12 = dp[i - 1][j - 2] + (sim12 > 0.15 ? sim12 * 10 : -3);
            }

            // Find Max
            let maxScore = score11;
            let dir = 1;

            if (score21 >= maxScore) { maxScore = score21; dir = 4; }
            if (score12 >= maxScore) { maxScore = score12; dir = 5; }
            if (scoreRem >= maxScore) { maxScore = scoreRem; dir = 2; }
            // Bias towards matching/merging over pure adding/removing if close, but standard logic
            if (scoreAdd >= maxScore) { maxScore = scoreAdd; dir = 3; }

            // Prefer 1:1 if tie with simple Remove/Add
            // Prioritize Match > Merge > Rem > Add
            if (dir === 2 && score21 >= scoreRem) { maxScore = score21; dir = 4; } // Merge > Rem
            if (dir === 2 && score11 >= scoreRem) { maxScore = score11; dir = 1; }
            if (dir === 3 && score11 >= scoreAdd) { maxScore = score11; dir = 1; }
            if (dir === 3 && scoreRem >= scoreAdd) { maxScore = scoreRem; dir = 2; } // Rem > Add if equal?

            dp[i][j] = maxScore;
            ptr[i][j] = dir;
        }
    }

    const result: DiffRow[] = [];
    let i = N, j = M;

    while (i > 0 || j > 0) {
        const dir = ptr[i][j];

        if (dir === 1) { // 1:1
            result.unshift({ type: 'modified', original: removed[i - 1], corrected: added[j - 1] });
            i--; j--;
        } else if (dir === 4) { // 2:1 Merge Original
            result.unshift({
                type: 'modified',
                original: removed[i - 2] + " " + removed[i - 1],
                corrected: added[j - 1]
            });
            i -= 2; j--;
        } else if (dir === 5) { // 1:2 Split Original
            result.unshift({
                type: 'modified',
                original: removed[i - 1],
                corrected: added[j - 2] + " " + added[j - 1]
            });
            i--; j -= 2;
        } else if (dir === 2 || (i > 0 && j === 0)) { // Remove
            // Fallback if we hit boundary with items left
            result.unshift({ type: 'removed', original: removed[i - 1] });
            i--;
        } else { // Add or dir===3
            result.unshift({ type: 'added', corrected: added[j - 1] });
            j--;
        }
    }

    return result;
}

// Main Calculation Function
export function calculateDiffRows(original: string, corrected: string): DiffRow[] {
    const originalSentences = splitIntoSentences(original);
    const correctedSentences = splitIntoSentences(corrected);

    const sentenceDiffs = diffArrays(originalSentences, correctedSentences);
    const rows: DiffRow[] = [];

    for (let i = 0; i < sentenceDiffs.length; i++) {
        const part = sentenceDiffs[i];

        if (part.removed) {
            if (i + 1 < sentenceDiffs.length && sentenceDiffs[i + 1].added) {
                const aligned = alignBlocks(part.value, sentenceDiffs[i + 1].value);
                rows.push(...aligned);
                i++;
            } else {
                part.value.forEach(val => rows.push({ type: 'removed', original: val }));
            }
        } else if (part.added) {
            part.value.forEach(val => rows.push({ type: 'added', corrected: val }));
        } else {
            part.value.forEach(val => rows.push({ type: 'unchanged', original: val, corrected: val }));
        }
    }

    return rows;
}
