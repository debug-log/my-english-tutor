import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate URL format
const isValidUrl = (url: string) => {
    try {
        return url.startsWith('http://') || url.startsWith('https://');
    } catch {
        return false;
    }
};

if (!isValidUrl(supabaseUrl)) {
    console.warn('Invalid Supabase URL provided. Please check NEXT_PUBLIC_SUPABASE_URL in .env.local');
}

export const supabase = createClient(
    isValidUrl(supabaseUrl) ? supabaseUrl : 'https://placeholder.supabase.co',
    supabaseAnonKey
);
