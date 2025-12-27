"use client";

import { create } from "zustand";
import { Entry, NewEntry } from "@/types";
import { normalizeContent } from "@/lib/formatter";

const STORAGE_KEY = "english-tutor-entries";

interface EntryStore {
    entries: Entry[];
    isLoaded: boolean;
    setEntries: (entries: Entry[]) => void;
    addEntry: (entry: NewEntry) => void;
    updateEntry: (id: string, updated: Partial<Entry>) => void;
    deleteEntry: (id: string) => void;
    importEntries: (entries: Entry[]) => void;
}

export const useEntries = create<EntryStore>((set) => ({
    entries: [],
    isLoaded: false,

    setEntries: (entries) => set({ entries }),

    addEntry: (entry) =>
        set((state) => {
            // Normalize before adding
            const normalizedEntry = {
                ...entry,
                id: crypto.randomUUID(),
                originalText: normalizeContent(entry.originalText),
                correction: entry.correction ? normalizeContent(entry.correction) : undefined
            };

            const newEntries = [normalizedEntry, ...state.entries];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
            return { entries: newEntries };
        }),

    updateEntry: (id, updated) =>
        set((state) => {
            const newEntries = state.entries.map((entry) =>
                entry.id === id ? {
                    ...entry,
                    ...updated,
                    originalText: updated.originalText !== undefined ? normalizeContent(updated.originalText) : entry.originalText,
                    correction: updated.correction !== undefined ? normalizeContent(updated.correction) : entry.correction
                } : entry
            );
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
            return { entries: newEntries };
        }),

    deleteEntry: (id) =>
        set((state) => {
            const newEntries = state.entries.filter((entry) => entry.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
            return { entries: newEntries };
        }),

    importEntries: (importedEntries) =>
        set((state) => {
            const existingKeys = new Set(
                state.entries.map(e => `${e.date}-${normalizeContent(e.originalText)}`)
            );

            const newUniqueEntries: Entry[] = [];

            importedEntries.forEach(entry => {
                // Ensure imported data respects current normalization rules
                const normalizedOriginal = normalizeContent(entry.originalText);
                const normalizedCorrection = entry.correction ? normalizeContent(entry.correction) : undefined;

                const key = `${entry.date}-${normalizedOriginal}`;

                if (!existingKeys.has(key)) {
                    existingKeys.add(key); // prevent duplicates within the import itself
                    newUniqueEntries.push({
                        ...entry,
                        id: crypto.randomUUID(), // Always generate new ID to avoid collisions
                        originalText: normalizedOriginal,
                        correction: normalizedCorrection
                    });
                }
            });

            if (newUniqueEntries.length === 0) {
                return state; // No changes
            }

            const finalEntries = [...newUniqueEntries, ...state.entries];
            // Sort by date desc (optional, but good practice if mixed)
            finalEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            localStorage.setItem(STORAGE_KEY, JSON.stringify(finalEntries));
            return { entries: finalEntries };
        }),
}));

// Initialize from localStorage
if (typeof window !== "undefined") {
    const store = useEntries.getState();

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const parsed: Entry[] = JSON.parse(saved);

            const uniqueEntries: Entry[] = [];
            const seen = new Set();
            let hasChanges = false;

            parsed.forEach(entry => {
                // Apply normalization during migration/load
                const normalizedOriginalText = normalizeContent(entry.originalText);
                const normalizedCorrection = entry.correction ? normalizeContent(entry.correction) : undefined;

                // Check if normalization changed anything
                if (normalizedOriginalText !== entry.originalText || normalizedCorrection !== entry.correction) {
                    hasChanges = true;
                }

                const key = `${entry.date}-${normalizedOriginalText}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueEntries.push({
                        ...entry,
                        originalText: normalizedOriginalText,
                        correction: normalizedCorrection,
                    });
                } else {
                    hasChanges = true; // Duplicate removal counts as change
                }
            });

            store.setEntries(uniqueEntries);

            // Update storage if migration occurred
            if (hasChanges) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueEntries));
            }
        } catch (e) {
            console.error("Failed to parse entries from localStorage", e);
        }
    }

    // Set isLoaded to true
    useEntries.setState({ isLoaded: true });
}
