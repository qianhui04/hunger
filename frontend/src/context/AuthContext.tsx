import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

export interface CustomUser {
    uid: string;
    email: string;
    name?: string;
    role: 'super_admin' | 'admin';
    status: 'pending' | 'approved' | 'rejected';
}

interface AuthContextType {
    user: CustomUser | null;
    loading: boolean;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => { },
    refreshUser: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<CustomUser | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch or automatically initialize profile details from Supabase 'admin_profiles'
    const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<CustomUser | null> => {
        const email = supabaseUser.email || "";
        if (!email) return null;

        try {
            let { data, error } = await supabase
                .from('admin_profiles')
                .select('*')
                .eq('email', email)
                .maybeSingle();

            if (error) throw error;

            // Create fallback profile entry if auth record exists but table entry is missing
            if (!data) {
                const newProfile = {
                    id: supabaseUser.id,
                    email: email,
                    name: supabaseUser.user_metadata?.full_name || email.split('@')[0],
                    role: 'admin',
                    status: 'pending',
                };

                const { data: insertedData, error: insertError } = await supabase
                    .from('admin_profiles')
                    .insert([newProfile])
                    .select()
                    .single();

                if (insertError) throw insertError;
                data = insertedData;
            }

            return {
                uid: supabaseUser.id,
                email: data.email,
                name: data.name,
                role: data.role as 'admin' | 'super_admin',
                status: data.status as 'pending' | 'approved' | 'rejected',
            };

        } catch (err) {
            console.warn("Error fetching Supabase user profile:", err);

            // Fallback for offline or local cache checks
            const localProfiles = JSON.parse(localStorage.getItem('admin_profiles') || '[]');
            const found = localProfiles.find((p: any) => p.email.toLowerCase() === email.toLowerCase());

            if (found) {
                return {
                    uid: supabaseUser.id,
                    email,
                    name: found.name || email.split('@')[0],
                    role: found.role || 'admin',
                    status: found.status || 'pending',
                };
            }

            return null;
        }
    };

    // Authorize user based on application status (only 'approved' accounts enter)
    const handleProfileAuthorization = async (profile: CustomUser | null): Promise<boolean> => {
        if (!profile) {
            setUser(null);
            return false;
        }

        if (profile.status === 'approved') {
            setUser(profile);
            return true;
        }

        // Force sign out if status is pending or rejected
        await supabase.auth.signOut();
        setUser(null);

        if (profile.status === 'pending') {
            alert("Access Pending: Your registration application is awaiting Super Admin verification.");
        } else {
            alert("Access Denied: Your admin application access has been rejected.");
        }
        return false;
    };

    // Manually re-fetch profile and authorization details
    const refreshUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const profile = await fetchUserProfile(session.user);
            await handleProfileAuthorization(profile);
        }
    };

    // Terminate active session
    const logout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error("Error logging out from Supabase Auth:", err);
        } finally {
            setUser(null);
        }
    };

    useEffect(() => {
        let mounted = true;

        // 1. Initial Session Check (allows persistence across page reloads)
        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const profile = await fetchUserProfile(session.user);
                    if (mounted) {
                        await handleProfileAuthorization(profile);
                    }
                }
            } catch (err) {
                console.error("Auth initialization error:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        initializeAuth();

        // 2. Real-time Auth State Change Observer (fires on sign in, sign out, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                const profile = await fetchUserProfile(session.user);
                await handleProfileAuthorization(profile);
                setLoading(false);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};