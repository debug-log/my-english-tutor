import { create } from 'zustand';

export interface LogEntry {
    id: string;
    timestamp: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'query';
    message: string;
    details?: any;
}

interface DebugState {
    logs: LogEntry[];
    isOpen: boolean;
    isEnabled: boolean;
    unreadCount: number;
    addLog: (type: LogEntry['type'], message: string, details?: any) => void;
    clearLogs: () => void;
    togglePanel: () => void;
    toggleDebugMode: () => void;
}

export const useDebugStore = create<DebugState>((set) => ({
    logs: [],
    isOpen: false,
    isEnabled: true, // Default to true for debugging
    unreadCount: 0,

    addLog: (type, message, details) => {
        set((state) => {
            if (!state.isEnabled) return state; // Don't log if disabled

            const newLog: LogEntry = {
                id: crypto.randomUUID(),
                timestamp: new Date().toLocaleTimeString(),
                type,
                message,
                details,
            };

            return {
                logs: [newLog, ...state.logs].slice(0, 100),
                unreadCount: state.isOpen ? 0 : state.unreadCount + 1
            };
        });
    },

    clearLogs: () => set({ logs: [], unreadCount: 0 }),
    togglePanel: () => set((state) => ({
        isOpen: !state.isOpen,
        unreadCount: !state.isOpen ? 0 : state.unreadCount // Reset unread when opening
    })),
    toggleDebugMode: () => set((state) => ({ isEnabled: !state.isEnabled })),
}));
