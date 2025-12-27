export interface Entry {
    id: string;
    date: string;
    originalText: string;
    correction?: string;
    notes?: string;
    aiCorrection?: string;
    aiNotes?: string;
    tags?: string[];
}

export type NewEntry = Omit<Entry, 'id'>;
