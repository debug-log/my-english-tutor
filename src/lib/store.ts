"use client";

import { create } from "zustand";
import { Entry, NewEntry } from "@/types";
import { normalizeContent } from "@/lib/formatter";
import { supabase } from "@/lib/supabase";

interface EntryStore {
    entries: Entry[];
    isLoaded: boolean;
    isLoading: boolean;
    error: string | null;

    fetchEntries: () => Promise<void>;
    setEntries: (entries: Entry[]) => void;
    addEntry: (entry: NewEntry) => Promise<void>;
    updateEntry: (id: string, updated: Partial<Entry>) => Promise<void>;
    deleteEntry: (id: string) => Promise<void>;
    importEntries: (entries: Entry[]) => Promise<void>;
}

export const useEntries = create<EntryStore>((set, get) => ({
    entries: [],
    isLoaded: false,
    isLoading: false,
    error: null,

    setEntries: (entries) => set({ entries }),

    fetchEntries: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('entries')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;

            // Map db fields if needed, but our schema matches mostly
            const mappedEntries = (data || []).map(row => ({
                id: row.id,
                date: row.date,
                originalText: row.original_text,
                correction: row.correction,
                notes: row.notes,
                aiCorrection: row.ai_correction,
                aiNotes: row.ai_notes,
                tags: row.tags
            }));

            set({ entries: mappedEntries, isLoaded: true });
        } catch (e: any) {
            set({ error: e.message });
        } finally {
            set({ isLoading: false });
        }
    },

    addEntry: async (entry) => {
        set({ isLoading: true, error: null });
        try {
            const normalizedOriginal = normalizeContent(entry.originalText);
            const normalizedCorrection = entry.correction ? normalizeContent(entry.correction) : undefined;

            const newEntryPayload = {
                date: entry.date,
                original_text: normalizedOriginal,
                correction: normalizedCorrection,
                notes: entry.notes,
                tags: entry.tags
            };

            const { data, error } = await supabase
                .from('entries')
                .insert(newEntryPayload)
                .select()
                .single();

            if (error) throw error;

            const newEntry: Entry = {
                id: data.id,
                date: data.date,
                originalText: data.original_text,
                correction: data.correction,
                notes: data.notes,
                aiCorrection: data.ai_correction,
                aiNotes: data.ai_notes,
                tags: data.tags
            };

            set((state) => ({
                entries: [newEntry, ...state.entries]
            }));
        } catch (e: any) {
            console.error("Failed to add entry", e);
            set({ error: e.message });
            throw e;
        } finally {
            set({ isLoading: false });
        }
    },

    updateEntry: async (id, updated) => {
        set({ isLoading: true, error: null });
        try {
            // Prepare update payload
            const payload: any = {};
            if (updated.date) payload.date = updated.date;
            if (updated.originalText) payload.original_text = normalizeContent(updated.originalText);
            if (updated.correction) payload.correction = normalizeContent(updated.correction);
            if (updated.notes !== undefined) payload.notes = updated.notes;
            if (updated.aiCorrection) payload.ai_correction = normalizeContent(updated.aiCorrection);
            if (updated.aiNotes !== undefined) payload.ai_notes = updated.aiNotes;
            if (updated.tags) payload.tags = updated.tags;

            // Debug Log Payload
            import('./debug-store').then(({ useDebugStore }) => {
                useDebugStore.getState().addLog('query', 'Update Entry Payload', { id, payload });
            });

            const { data, error } = await supabase
                .from('entries')
                .update(payload)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            // Debug Log Success
            import('./debug-store').then(({ useDebugStore }) => {
                useDebugStore.getState().addLog('success', 'Update Entry DB Success', data);
            });

            set((state) => ({
                entries: state.entries.map((e) =>
                    e.id === id ? {
                        ...e,
                        ...updated,
                        originalText: data.original_text,
                        correction: data.correction,
                        aiCorrection: data.ai_correction,
                        aiNotes: data.ai_notes
                    } : e
                )
            }));
        } catch (e: any) {
            console.error("Failed to update entry", e);
            // Debug Log Error
            import('./debug-store').then(({ useDebugStore }) => {
                useDebugStore.getState().addLog('error', 'Update Entry DB Failed', e);
            });
            set({ error: e.message });
            throw e;
        } finally {
            set({ isLoading: false });
        }
    },

    deleteEntry: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await supabase
                .from('entries')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set((state) => ({
                entries: state.entries.filter((e) => e.id !== id)
            }));
        } catch (e: any) {
            console.error("Failed to delete entry", e);
            set({ error: e.message });
            throw e;
        } finally {
            set({ isLoading: false });
        }
    },

    importEntries: async (importedEntries) => {
        // Implement bulk import if needed, or loop insert
        // prioritizing fetch for now. Logic is complex for bulk upsert, keep simple for now.
        console.warn("importEntries to Supabase not yet optimized for bulk");

        for (const entry of importedEntries) {
            await get().addEntry(entry);
        }
    }
}));
