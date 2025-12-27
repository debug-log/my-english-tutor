import { create } from "zustand";
import { supabase } from "@/lib/supabase";

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
        // make checks specific if needed
    };
    // Relaxed typing for now to match JSON structure stored
    [key: string]: any;
}

interface AnalysisState {
    history: AnalysisResult[];
    isLoading: boolean;
    error: string | null;

    fetchHistory: () => Promise<void>;
    addAnalysis: (result: AnalysisResult) => Promise<void>;
    clearHistory: () => Promise<void>;
    getLatestAnalysis: () => AnalysisResult | null;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
    history: [],
    isLoading: false,
    error: null,

    fetchHistory: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('analysis_history')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;

            const mappedHistory = (data || []).map(row => row.result as AnalysisResult);
            set({ history: mappedHistory });
        } catch (e: any) {
            set({ error: e.message });
        } finally {
            set({ isLoading: false });
        }
    },

    addAnalysis: async (result) => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await supabase
                .from('analysis_history')
                .insert({
                    date: new Date().toISOString(), // Use current timestamp for record or result.date? Usually result.date matches entry date
                    result: result
                });

            if (error) throw error;

            set((state) => ({ history: [result, ...state.history] }));
        } catch (e: any) {
            console.error("Failed to save analysis", e);
            set({ error: e.message });
            throw e; // Let UI handle
        } finally {
            set({ isLoading: false });
        }
    },

    clearHistory: async () => {
        // Maybe dangerous to allow clearing all history in DB?
        // For now just clear local state or implement soft delete
        set({ history: [] });
    },

    getLatestAnalysis: () => {
        const { history } = get();
        return history.length > 0 ? history[0] : null;
    },
}));
