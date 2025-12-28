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
    rubricAnalysis?: {
        grammar: { diagnosis: string; improvement: string; };
        vocabulary: { diagnosis: string; improvement: string; };
        logic: { diagnosis: string; improvement: string; };
        flow: { diagnosis: string; improvement: string; };
        tone: { diagnosis: string; improvement: string; };
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
    _fetchPromise: Promise<void> | null;

    fetchHistory: (force?: boolean) => Promise<void>;
    addAnalysis: (result: AnalysisResult) => Promise<void>;
    clearHistory: () => Promise<void>;
    getLatestAnalysis: () => AnalysisResult | null;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
    history: [],
    isLoading: false,
    error: null,
    _fetchPromise: null,

    fetchHistory: async (force = false) => {
        const { history, _fetchPromise } = get();

        // 1. If data exists and not forced, return immediately
        if (!force && history.length > 0) return;

        // 2. If already fetching, return existing promise to prevent duplicate calls
        if (_fetchPromise) return _fetchPromise;

        // 3. Create new fetch promise
        const promise = (async () => {
            set({ isLoading: true, error: null });
            try {
                const { data, error } = await supabase
                    .from('analysis_history')
                    .select('*')
                    .order('date', { ascending: false })
                    .limit(1);

                if (error) throw error;

                const mappedHistory = (data || []).map(row => row.result as AnalysisResult);
                set({ history: mappedHistory });
            } catch (e: any) {
                set({ error: e.message });
            } finally {
                set({ isLoading: false, _fetchPromise: null });
            }
        })();

        set({ _fetchPromise: promise });
        return promise;
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

            // Optional: Keep only the latest few records to prevent table bloat
            // Since we only care about the latest, we could even delete all other records for this user
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: oldRecords } = await supabase
                    .from('analysis_history')
                    .select('id')
                    .order('date', { ascending: false })
                    .range(5, 100); // Keep top 5, get IDs of others

                if (oldRecords && oldRecords.length > 0) {
                    const idsToDelete = oldRecords.map(r => r.id);
                    await supabase.from('analysis_history').delete().in('id', idsToDelete);
                }
            }

            set((state) => ({ history: [result] })); // Update state to only have the latest one
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
