import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Activity, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff, HelpCircle } from 'lucide-react';
import { useFitness } from '../context/FitnessContext';

export const Login = () => {
  const { login } = useFitness();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(
        { email: email.trim().toLowerCase(), password },
        rememberMe ? 'local' : 'session'
      );
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F6FAF7] text-[#263D32] flex flex-col justify-center items-center px-4 py-12 selection:bg-[#DCEFE3] selection:text-[#263D32]">
      <div className="w-full max-w-[440px]">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DCEFE3] text-[#6BA985] border border-[#A8D5B5]/40 shadow-sm group-hover:scale-105 transition-transform mb-3">
              <Activity className="h-6 w-6 stroke-[2.2]" />
            </div>
            <span className="text-2xl font-black text-[#263D32] tracking-tight">
              MyFitSync
            </span>
            <span className="text-[11px] font-bold text-[#77847C] uppercase tracking-widest mt-1">
              Your Personal Fitness Intelligence
            </span>
          </Link>
        </div>

        {/* Clean Centered Auth Card (Strictly Image-Free) */}
        <div className="rounded-3xl border border-[#E5EDE7] bg-white p-7 sm:p-9 shadow-[0_10px_35px_-5px_rgba(38,61,50,0.06),0_2px_6px_-1px_rgba(38,61,50,0.03)]">
          <div className="mb-6 text-center sm:text-left">
            <h1 className="text-2xl font-black text-[#263D32] tracking-tight">
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-[#77847C] mt-1 leading-relaxed">
              Your fitness journey continues here.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#263D32] mb-1.5 tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#77847C] pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="athlete@example.com"
                  className="w-full rounded-xl border border-[#E5EDE7] bg-[#F6FAF7] pl-10 pr-4 py-3 text-sm text-[#263D32] placeholder-[#77847C] focus:bg-white focus:border-[#6BA985] focus:outline-none focus:ring-2 focus:ring-[#6BA985]/20 shadow-sm transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#263D32] tracking-wide">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-xs font-semibold text-[#6BA985] hover:text-[#263D32] hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#77847C] pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-[#E5EDE7] bg-[#F6FAF7] pl-10 pr-11 py-3 text-sm text-[#263D32] placeholder-[#77847C] focus:bg-white focus:border-[#6BA985] focus:outline-none focus:ring-2 focus:ring-[#6BA985]/20 shadow-sm transition-all font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#77847C] hover:text-[#263D32] transition-colors rounded-lg focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2.5 text-[#77847C] hover:text-[#263D32] font-medium cursor-pointer select-none transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-[#E5EDE7] text-[#6BA985] focus:ring-[#6BA985] accent-[#6BA985] cursor-pointer"
                />
                <span>Remember this device</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#6BA985] hover:bg-[#263D32] py-3.5 px-6 text-sm font-bold text-white shadow-[0_4px_16px_rgba(107,169,133,0.25)] hover:shadow-[0_6px_20px_rgba(38,61,50,0.18)] disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] transition-all cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center gap-2 text-white">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </div>
              ) : (
                <>
                  <span className="text-white font-bold">Sign In</span>
                  <ArrowRight className="h-4 w-4 text-white" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Navigation */}
        <p className="mt-8 text-center text-xs text-[#77847C]">
          New to MyFitSync?{' '}
          <Link to="/register" className="font-bold text-[#6BA985] hover:text-[#263D32] hover:underline transition-colors ml-1">
            Create account
          </Link>
        </p>
      </div>

      {/* Forgot Password Informational Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#263D32]/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#E5EDE7] bg-white p-6 shadow-2xl text-[#263D32] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DCEFE3] text-[#6BA985] border border-[#A8D5B5]/30">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#263D32]">Password Recovery</h3>
                <p className="text-[11px] text-[#77847C]">Reset instructions</p>
              </div>
            </div>
            <p className="text-xs text-[#77847C] leading-relaxed my-3">
              For security reasons, password resets are processed via authenticated cryptographic reset links. If you need assistance accessing your account, please reach out to our team at{' '}
              <a href="mailto:support@myfitsync.io" className="text-[#6BA985] font-semibold hover:underline">
                support@myfitsync.io
              </a>.
            </p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#6BA985] hover:bg-[#263D32] text-white text-xs font-bold transition-all shadow-sm"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
