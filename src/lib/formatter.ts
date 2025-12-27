export function normalizeContent(text: string): string {
    if (!text) return "";

    // 1. Split into potential chunks/lines
    const lines = text.split(/\r?\n/);

    const cleanLines = lines.map(line => {
        // Remove leading dashes, asterisks, bullets followed by optional space
        // e.g., "- Hello", "* Hello", "  - Hello"
        let clean = line.replace(/^[\s-]*\s?/, "").trim();

        if (!clean) return null;

        // Ensure it ends with punctuation if it looks like a sentence
        // (Contains letters, longer than a few chars)
        if (/[a-zA-Z]/.test(clean) && !/[.!?]$/.test(clean)) {
            clean += ".";
        }
        return clean;
    }).filter(Boolean);

    // Join with spaces first to unify text
    const joined = cleanLines.join(" ");

    // Enforce newline after sentence terminators (.!?) followed by space
    // We uses a lookbehind to avoid identifying abbreviations (a.m., p.m., etc.) as sentence ends.
    // We also handle optional quotes/parens after the punctuation.
    // Regex Breakdown:
    // (?<!\b(?:a\.m|p\.m|vs|Mr|Ms|Mrs|Dr|e\.g|i\.e))  -> Negative lookbehind for common abbreviations
    // ([.!?]['"]?)                                   -> Match terminator followed by optional quote
    // \s+                                            -> Followed by whitespace

    // Note: JS lookbehind support is good in modern environments (Next.js target).
    // But to be safe and simple, we can match carefully.

    return joined.replace(/(?<!\b(?:a\.m|p\.m|vs|Mr|Ms|Mrs|Dr|e\.g|i\.e))([.!?]['"]?)\s+/g, "$1\n");
}
