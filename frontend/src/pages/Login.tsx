import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';


export function Login() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Core loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // FORGOT PASSWORD MODAL LOCAL STATES
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalError, setModalError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMessage('');
    setIsLoading(true);

    const normalizedEmail = email.trim().toLocaleLowerCase();

    if (!normalizedEmail.endsWith('@um.edu.my') && !normalizedEmail.endsWith('@siswa.um.edu.my')) {
      setErrorMessage('Access Denied. You must use an official UM email address (@um.edu.my or @siswa.um.edu.my).');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      console.log("LOGIN STEP 1", data.user, error);

      if (error) {
        throw error;
      }

      const user = data.user;

      console.log("LOGIN STEP 2", user);

      if (!user) {
        setErrorMessage('Unable to retrieve user information.');
        return;
      }

      const authorized = await refreshUser();

      if (authorized) {
        navigate('/dashboard', { replace: true });
      }

      console.log("LOGIN STEP 3");
    } catch (err: any) {
      console.error("Login error detailed:", err);

      setErrorMessage(
        err.message || 'An unexpected error occurred during system authentication.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // FORGOT PASSWORD SUBMIT ENGINE
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalLoading) return;

    setModalError('');
    setModalMessage('');
    setModalLoading(true);

    const targetEmail = resetEmail.trim().toLowerCase();

    // 1. Validate UM email domain
    if (
      !targetEmail.endsWith('@um.edu.my') &&
      !targetEmail.endsWith('@siswa.um.edu.my')
    ) {
      setModalError(
        'Please use an official UM email address (@um.edu.my or @siswa.um.edu.my).'
      );
      setModalLoading(false);
      return;
    }

    try {
      // 2. Ask Supabase Auth to send the password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(
        targetEmail,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) throw error;

      // Use generic wording to avoid revealing whether an account exists
      setModalMessage(
        'If an account is registered with this email, a reset link will be sent.'
      );
    } catch (error: any) {
      console.error('Forgot password flow error:', error);
      setModalError(
        'Unable to send the password reset email. Please try again later.'
      );
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F5E9] via-[#F1F8E9] to-[#F5FAF5] flex items-center justify-center p-4 relative">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <img
            src="/zero_hunger_um_logo.png"
            alt="Zero Hunger UM"
            className="w-32 h-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-semibold text-[#212121]">Zero Hunger UM</h1>
          <p className="text-[#558B2F] mt-2 font-medium">Admin Dashboard</p>
          <p className="text-sm text-[#9E9E9E] mt-1">Universiti Malaya • 2026</p>
        </div>

        {/* Login Form Container */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-xl font-semibold text-[#212121] mb-2">Welcome Back</h2>
          <p className="text-sm text-[#9E9E9E] mb-6">Sign in to access your admin dashboard</p>

          {errorMessage && (
            <div className="mb-5 p-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-[#212121] mb-2">UM Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E]" size={20} />
                <input
                  type="email"
                  value={email}
                  disabled={isLoading}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@um.edu.my"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-[#F5FAF5] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-[#212121] mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E]" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  disabled={isLoading}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg bg-[#F5FAF5] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] transition-all [&::-ms-reveal]:hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E9E9E] hover:text-[#2E7D32] transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Trigger */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  disabled={isLoading}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-[#2E7D32] rounded"
                />
                <span className="text-sm text-[#212121]">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setResetEmail('');
                  setModalError('');
                  setModalMessage('');
                  setIsModalOpen(true);
                }}
                className="text-sm text-[#2E7D32] hover:text-[#1B5E20] transition-colors font-medium"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 flex items-center justify-center gap-2 text-white font-medium rounded-lg transition-colors ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#2E7D32] hover:bg-[#1B5E20]'
                }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider and Register hooks... */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-[#9E9E9E]">or</span></div>
          </div>
          <div className="text-center">
            <p className="text-sm text-[#9E9E9E]">
              Don't have an account?{' '}
              <button type="button" onClick={() => navigate('/register')} className="text-[#2E7D32] hover:text-[#1B5E20] font-medium transition-colors">
                Register here
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          FORGOT PASSWORD MODAL OVERLAY (UC-3 UI Flow)
          ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden transform transition-all scale-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#F5FAF5]">
              <h3 className="font-semibold text-[#212121]">Account Recovery Gateway</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {modalMessage ? (
                <div className="space-y-4">
                  <div className="p-4 text-sm text-[#2E7D32] bg-green-50 border border-green-100 rounded-xl font-medium">
                    {modalMessage}
                  </div>
                  <p className="text-xs text-gray-400">Didn't see the email? Remember to inspect your junk folder filters.</p>
                  <button
                    type="button"
                    onClick={handleForgotPasswordSubmit}
                    disabled={modalLoading}
                    className="w-full py-2.5 text-sm font-semibold text-white bg-[#2E7D32] hover:bg-[#1B5E20] rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {modalLoading && <Loader2 className="animate-spin" size={16} />}
                    Resend Link
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <p className="text-sm text-gray-500">Provide your registered system administrator parameters to request an outbound security pass sequence key.</p>

                  {modalError && (
                    <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-100 rounded-lg">
                      {modalError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Registered UM Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E]" size={18} />
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="username@um.edu.my"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32] transition-all bg-[#F5FAF5]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="w-full py-3 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {modalLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>Verifying Database Registry...</span>
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}