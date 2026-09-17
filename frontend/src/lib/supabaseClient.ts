import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
    },
});

export const getAuthenticatedSupabase = async () => {
    try {

        const authenticatedSupabase = createClient(
            supabaseUrl,
            supabaseAnonKey,
        );

        return authenticatedSupabase;
    } catch (error) {
        console.error("Critical failure during token exchange with Firebase Auth service:", error);
        throw new Error("Unable to retrieve Firebase authentication token. Please ensure you are logged in and try again.");
    }
};