import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export function ResetPassword() {
    const [searchParams] = useSearchParams();
    const recoveryType = searchParams.get('type');
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [isVerifyingCode, setIsVerifyingCode] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [linkExpired, setLinkExpired] = useState(false);

    const [isRecoveryVerified, setIsRecoveryVerified] = useState(false);
    const [recoveryError, setRecoveryError] = useState(false);

    // Validate action link token state on component creation
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {

                console.log('AUTH EVENT:', event, 'HAS SESSION:', Boolean(session));

                if (event === 'PASSWORD_RECOVERY' && session) {
                    setIsRecoveryVerified(true);
                    setIsVerifyingCode(false);
                }

            }
        )
        return () => {
            subscription.unsubscribe();
        }
    }, []);

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading || !isRecoveryVerified) return;

        setErrorMsg('');

        if (newPassword !== confirmPassword) {
            setErrorMsg('Passwords do not match.');
            return;
        }

        if (newPassword.length < 8) {
            setErrorMsg('System Security Policy: Passwords must contain at least 8 characters.');
            return;
        }

        setIsLoading(true);

        try {

            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) throw error;

            alert('Password updated successfully!');
            navigate('/login');

        } catch (err: any) {

            console.error("Mutation failure state error:", err);
            setErrorMsg(err.message || 'Exception Flow - Connection failure during execution update.');

        } finally {

            setIsLoading(false);

        }
    };

    if (isVerifyingCode) {
        return (
            <div className="min-h-screen bg-[#F5FAF5] flex items-center justify-center p-4">
                <div className="text-center space-y-3">
                    <Loader2 className="animate-spin text-[#2E7D32] mx-auto" size={36} />
                    <p className="text-sm text-gray-500 font-medium">Validating security authorization signature...</p>
                </div>
            </div>
        );
    }

    if (linkExpired) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#E8F5E9] to-[#F5FAF5] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center space-y-5">
                    <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">⚠️</div>
                    <h2 className="text-xl font-bold text-[#212121]">Reset Link Expired</h2>
                    <p className="text-sm text-gray-500">The authorization timeline key has elapsed. Generate another pass link to perform changes.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
                    >
                        Return to Recovery Portal
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#E8F5E9] via-[#F1F8E9] to-[#F5FAF5] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100 space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-[#212121]">Set New Password</h2>
                    <p className="text-sm text-gray-400 mt-1">Provide custom credentials to regain access control status parameters.</p>
                </div>

                {errorMsg && (
                    <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-100 rounded-lg">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleUpdateSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E]" size={18} />
                            <input
                                type={showPass ? 'text' : 'password'}
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32] transition-all bg-[#F5FAF5]"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E9E9E] hover:text-[#2E7D32]"
                            >
                                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Confirm New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E]" size={18} />
                            <input
                                type={showPass ? 'text' : 'password'}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32] transition-all bg-[#F5FAF5]"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-medium rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        {isLoading && <Loader2 className="animate-spin" size={16} />}
                        Update Password
                    </button>
                </form>

                <div className="text-center pt-2">
                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="inline-flex items-center gap-1.5 text-xs text-[#9E9E9E] hover:text-gray-700 transition-colors"
                    >
                        <ArrowLeft size={14} /> Back to Sign In screen
                    </button>
                </div>
            </div>
        </div>
    );
}