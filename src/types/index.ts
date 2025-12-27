export interface Entry {
    id: string;
    date: string;
    originalText: string;
    correction?: string;
    notes?: string;
    tags?: string[];
}

export type NewEntry = Omit<Entry, 'id'>;
