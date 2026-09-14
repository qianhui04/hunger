import { createClient } from '@supabase/supabase-js';
import { getAuth } from "firebase/auth";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getAuthenticatedSupabase = async () => {
    try {
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (!currentUser) {
            return supabase
        }

        const token = await currentUser.getIdToken(true);

        const authenticatedSupabase = createClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            }
        );

        return authenticatedSupabase;
    } catch (error) {
        console.error("Critical failure during token exchange with Firebase Auth service:", error);
        throw new Error("Unable to retrieve Firebase authentication token. Please ensure you are logged in and try again.");
    }
};