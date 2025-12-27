import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AnalysisResult {
    date: string;
    grammarPatterns: {
        pattern: string;
        explanation: string;
        examples?: { incorrect: string; correct: string }[]
    }[];
    expressionAndVocabulary?: {
        analysis: string;
        improvementExamples: { before: string; after: string }[];
    };
    cohesionAndCoherence?: {
        analysis: string;
        suggestions: string[];
    };
    scores?: {
        grammar: number;
        vocabulary: number;
        coherence: number;
        clarity: number;
        expression: number;
    };
    rubricAnalysis?: {
        grammar: string;
        vocabulary: string;
        coherence: string;
        clarity: string;
        expression: string;
    };
    entryDateRange?: {
        start: string;
        end: string;
    };
    level: string;
    levelDescription?: string;
    strategy: (string | {
        action: string;
        example: string;
        // New structured fields
        theory?: string;
        mechanics?: string;
        application?: string;
        message?: string;
    })[];
    vocabularyList?: { word: string; meaning: string; example: string }[];
    quiz: { question: string; options: string[]; answer: number; explanation: string }[];
    rawDeepInsight?: any;
}

interface AnalysisState {
    history: AnalysisResult[];
    lastEntryCount: number;
    addAnalysis: (result: AnalysisResult, entryCount: number) => void;
    clearHistory: () => void;
    getLatestAnalysis: () => AnalysisResult | null;
}

export const useAnalysisStore = create<AnalysisState>()(
    persist(
        (set, get) => ({
            history: [],
            lastEntryCount: 0,
            addAnalysis: (result, entryCount) =>
                set((state) => ({
                    history: [result, ...state.history],
                    lastEntryCount: entryCount,
                })),
            clearHistory: () => set({ history: [], lastEntryCount: 0 }),
            getLatestAnalysis: () => {
                const { history } = get();
                return history.length > 0 ? history[0] : null;
            },
        }),
        {
            name: "english-tutor-analysis-storage",
        }
    )
);
