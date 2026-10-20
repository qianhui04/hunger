import React, { useState } from 'react';
import { PasswordInput } from '../components/PasswordInput';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validatePasswordStructure = (password: string): boolean => {
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    return passwordRegex.test(password);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.name || !formData.email || !formData.studentId || !formData.password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (!formData.email.endsWith('@um.edu.my') && !formData.email.endsWith('@siswa.um.edu.my')) {
      setErrorMessage('Please use your official UM email address (@um.edu.my OR @siswa.um.edu.my)');
      return;
    }

    if (!validatePasswordStructure(formData.password)) {
      setErrorMessage('Password must be at least 8 characters long, containing at least one uppercase letter, one lowercase letter, and one number.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (!agreed) {
      setErrorMessage('Please agree to the terms and conditions');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            studentId: formData.studentId,
          },
        },
      });

      if (error) {
        throw error;
      }

      const user = data.user;

      if (!user) {
        throw new Error('Unable to create user account.');
      }

      // const { error: profileError } = await supabase
      //   .from('admin_profiles')
      //   .insert({
      //     id: user.id,
      //     email: formData.email.toLowerCase(),
      //     name: formData.name,
      //     student_id: formData.studentId,
      //   });

      // if (profileError) {
      //   throw profileError;
      // }

      alert('Registration successful! Awaiting Super Admin verification approval.');
      navigate('/login');

    } catch (err: any) {
      console.error('MVC pipeline registration execution failed:', err);
      setErrorMessage(err.message || 'An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F5E9] via-[#F1F8E9] to-[#F5FAF5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/zero_hunger_um_logo.png"
            alt="Zero Hunger UM"
            className="w-32 h-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-semibold text-[#212121]">Create Account</h1>
          <p className="text-[#558B2F] mt-2">Join Zero Hunger UM Admin Platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleRegister} className="space-y-5">
            {errorMessage && (
              <div className="p-4 rounded-lg bg-[#FFEBEE] border border-[#FFCDD2] text-[#D32F2F] text-sm font-medium">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#212121] mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E]" size={20} />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-[#F5FAF5] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#212121] mb-2">UM Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E]" size={20} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your.name@um.edu.my"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-[#F5FAF5] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#212121] mb-2">Student / Staff ID</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E]" size={20} />
                <input
                  type="text"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  placeholder="e.g., S12345678"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-[#F5FAF5] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <PasswordInput
              label="Password"
              value={formData.password}
              onChange={(value) => setFormData({ ...formData, password: value })}
              visible={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
              placeholder="Create a strong password"
              inputClassName="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg bg-[#F5FAF5] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-all"
            />

            <PasswordInput
              label="Confirm Password"
              value={formData.confirmPassword}
              onChange={(value) => setFormData({ ...formData, confirmPassword: value })}
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
              placeholder="Re-enter your password"
              inputClassName="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg bg-[#F5FAF5] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-all"
            />

            <div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-4 h-4 mt-1 accent-[#2E7D32] rounded"
                />
                <span className="text-sm text-[#212121]">
                  I agree to the{' '}
                  <button type="button" className="text-[#2E7D32] hover:underline">Terms and Conditions</button>
                  {' '}and{' '}
                  <button type="button" className="text-[#2E7D32] hover:underline">Privacy Policy</button>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#2E7D32] text-white rounded-lg hover:bg-[#1B5E20] disabled:bg-gray-400 transition-colors font-medium flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-[#9E9E9E]">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-[#2E7D32] hover:text-[#1B5E20] font-medium transition-colors"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-xs text-[#9E9E9E]">Zero Hunger UM - Food Sharing Monitoring Platform</p>
          <p className="text-xs text-[#9E9E9E] mt-1">© 2026 Universiti Malaya. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}