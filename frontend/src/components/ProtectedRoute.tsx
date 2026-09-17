import React, { useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface ProtectedRouteProps {
    allowedRoles?: ('super_admin' | 'admin')[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;

        let timeoutId: ReturnType<typeof setTimeout>;
        const timeoutInMinutes = 15;

        const resetTimer = () => {
            clearTimeout(timeoutId);

            timeoutId = setTimeout(async () => {
                alert("Session expired due to inactivity. Please log in again.");

                await supabase.auth.signOut();
                navigate('/login', { replace: true });
            }, timeoutInMinutes * 60 * 1000);
        };

        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keypress', resetTimer);
        window.addEventListener('click', resetTimer);
        window.addEventListener('scroll', resetTimer);

        resetTimer();

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keypress', resetTimer);
            window.removeEventListener('click', resetTimer);
            window.removeEventListener('scroll', resetTimer);
        };
    }, [user, navigate]);

    if (loading) {
        return (
            <div className="flex items-center h-screen w-screen justify-center bg-gray-50">
                <div className="text-gray-500 font-medium">
                    Authorizing secure workspace access...
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        console.warn(
            `Unauthorized access attempt blocked for user role: ${user.role}`
        );

        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}