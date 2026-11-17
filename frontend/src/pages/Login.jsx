import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Activity, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useFitness } from '../context/FitnessContext';

export const Login = () => {
  const { login } = useFitness();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Activity className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              MyFitSync
            </span>
          </Link>
          <h2 className="text-xl font-bold text-white tracking-tight">Welcome back</h2>
          <p className="text-xs text-slate-400 mt-1">Sign in to access your personal fitness intelligence</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#20252E] bg-[#161A21] p-6 sm:p-8 shadow-2xl">
          {error && (
            <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-[#FF5A5F]/30 bg-[#FF5A5F]/10 p-3.5 text-xs text-[#FF5A5F]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#9AA3B2] mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#9AA3B2]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="athlete@example.com"
                  className="w-full rounded-xl border border-[#20252E] bg-[#0B0D10] pl-10 pr-4 py-2.5 text-sm text-[#F5F7FA] placeholder-[#9AA3B2]/50 focus:border-[#C6FF3D] focus:outline-none focus:ring-1 focus:ring-[#C6FF3D]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9AA3B2] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#9AA3B2]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-[#20252E] bg-[#0B0D10] pl-10 pr-4 py-2.5 text-sm text-[#F5F7FA] placeholder-[#9AA3B2]/50 focus:border-[#C6FF3D] focus:outline-none focus:ring-1 focus:ring-[#C6FF3D]"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-[#9AA3B2] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#20252E] bg-[#0B0D10] text-[#C6FF3D] focus:ring-[#C6FF3D]"
                />
                <span>Remember this device</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#C6FF3D] hover:bg-[#b5f526] py-3 text-sm font-black text-[#0B0D10] shadow-lg shadow-[#C6FF3D]/10 disabled:opacity-50 active:scale-95 transition-all"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Bottom switch to register */}
        <p className="mt-6 text-center text-xs text-[#9AA3B2]">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-semibold text-[#C6FF3D] hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
