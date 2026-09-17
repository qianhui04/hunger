import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export interface CustomUser {
    id: string;
    email: string;
    name?: string;
    role: 'super_admin' | 'admin';
    status: 'pending' | 'approved' | 'rejected';
}

interface AuthContextType {
    user: CustomUser | null;
    loading: boolean;
    logout: () => Promise<void>;
    refreshUser: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => { },
    refreshUser: async () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<CustomUser | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = async (authUser: any): Promise<CustomUser | null> => {

        try {
            console.log("AUTH CONTEXT USER ID:", authUser.id);

            let { data, error } = await supabase
                .from('admin_profiles')
                .select('*')
                .eq('id', authUser.id)
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                return null;
            }
            console.log("AUTH CONTEXT USER:", data);

            return {
                id: data.id,
                email: data.email,
                name: data.name,
                role: data.role as 'admin' | 'super_admin',
                status: data.status as 'pending' | 'approved' | 'rejected',
            };

        } catch (err) {
            console.error("Failed to fetch admin profile:", err);
            return null;
        }
    };

    const handleProfileAuthorization = async (profile: CustomUser | null): Promise<boolean> => {
        console.log("PROFILE:", profile);

        if (!profile) {
            setUser(null);
            return false;
        }

        if (profile.status === 'approved') {
            setUser(profile);
            return true;
        }

        setUser(null);

        if (profile.status === 'pending') {
            alert("Access Pending: Your registration application is awaiting Super Admin verification.");
        } else {
            alert("Access Denied: Your admin application access has been rejected.");
        }
        return false;
    };

    const refreshUser = async (): Promise<boolean> => {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            setUser(null);
            return false;
        }

        const profile = await fetchUserProfile(session.user);

        return await handleProfileAuthorization(profile);
    };

    const logout = async () => {
        try {
            console.log("LOGOUT: before signOut");

            const { data: before } = await supabase.auth.getSession();

            console.log("SESSION BEFORE LOGOUT:", before.session);

            const { error } = await supabase.auth.signOut({
                scope: 'local',
            });

            if (error) {
                throw error;
            }

            const { data: after } = await supabase.auth.getSession();

            console.log("SESSION AFTER LOGOUT:", after.session);

            setUser(null);

        } catch (err) {
            console.error("Logout failed:", err);
            throw err;
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
                console.log("AUTH INITIALIZATION FINISHED");
                if (mounted) setLoading(false);
            }
        };

        initializeAuth();

        // 2. Real-time Auth State Change Observer (fires on sign in, sign out, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                // setTimeout(async () => {
                //     const profile = await fetchUserProfile(session.user);

                //     if (mounted) {
                //         await handleProfileAuthorization(profile);
                //     }
                // }, 0);
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
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
};