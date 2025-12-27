import { create } from "zustand";
import { supabase } from "./supabase";
import { Session, User } from "@supabase/supabase-js";

interface AuthStore {
    session: Session | null;
    user: User | null;
    isLoading: boolean;
    isInitialized: boolean;

    setSession: (session: Session | null) => void;
    signOut: () => Promise<void>;
    initialize: () => Promise<void>;
}

export const useAuth = create<AuthStore>((set) => ({
    session: null,
    user: null,
    isLoading: true,
    isInitialized: false,

    setSession: (session) => {
        set({
            session,
            user: session?.user ?? null,
            isLoading: false
        });
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null, user: null });
    },

    initialize: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            set({
                session,
                user: session?.user ?? null,
                isLoading: false,
                isInitialized: true
            });

            // Listen for auth changes
            supabase.auth.onAuthStateChange((_event, session) => {
                set({
                    session,
                    user: session?.user ?? null,
                    isLoading: false
                });
            });
        } catch (error) {
            console.error("Auth initialization failed", error);
            set({ isLoading: false, isInitialized: true });
        }
    }
}));
