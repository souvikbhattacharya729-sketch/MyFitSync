import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, MessageSquareCode, Gauge, ShieldCheck, Flame, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

export const Landing = () => {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <header className="flex h-20 items-center justify-between px-6 md:px-12 max-w-7xl mx-auto w-full border-b border-slate-850">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
            <Activity className="h-6 w-6" />
          </div>
          <span className="text-xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            MyFitSync
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:opacity-90 active:scale-95 transition-all"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 md:px-6 py-20 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400 mb-8 backdrop-blur-sm shadow-sm">
          <Zap className="h-3.5 w-3.5" />
          <span>Next-Gen Deterministic NLP Fitness Tracking</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white max-w-4xl leading-[1.1]">
          Your Personal Fitness <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">Intelligence</span>.
        </h1>

        <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl font-normal leading-relaxed">
          Log full workouts, nutrition, and recovery in plain English. No tedious dropdowns or manual counters. Real sports science analytics computed instantly.
        </p>

        {/* Demo prompt bubble */}
        <div className="mt-10 w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#131B2A]/90 p-4 shadow-xl backdrop-blur-md text-left">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
            <span>Natural language input:</span>
            <span className="text-emerald-400 font-bold">Processed in 1 transaction</span>
          </div>
          <div className="rounded-xl bg-[#0B0F17] p-3 text-sm text-slate-200 border border-slate-800 font-mono">
            "Squats 100 kg 5 reps 3 sets at RPE 8, bench 70 kg for 8 reps x 3, ate 2200 kcal with 160 g protein, slept 7 hours."
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-300">
            <span className="rounded-lg bg-cyan-500/10 text-cyan-400 px-2.5 py-1 border border-cyan-500/20">✓ 2 Workouts Logged</span>
            <span className="rounded-lg bg-emerald-500/10 text-emerald-400 px-2.5 py-1 border border-emerald-500/20">✓ 2200 kcal / 160g Protein</span>
            <span className="rounded-lg bg-violet-500/10 text-violet-400 px-2.5 py-1 border border-violet-500/20">✓ 7h Recovery Saved</span>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            to="/register"
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-3.5 text-base font-bold text-slate-950 shadow-xl shadow-emerald-500/20 hover:opacity-90 active:scale-95 transition-all"
          >
            <span>Start Logging Free</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#131B2A] px-8 py-3.5 text-base font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            Sign In to Dashboard
          </Link>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-20 border-t border-slate-850 bg-[#0B0F17]/50 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-2xl border border-slate-800 bg-[#131B2A] p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 mb-4 border border-cyan-500/20">
              <MessageSquareCode className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Plain English NLP</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Deterministic rule-based conversational engine. Recognizes complex multi-set reps, pounds-to-kg conversions, RPE, and handles ambiguities via quick clarification chips.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#131B2A] p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/20">
              <Gauge className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Sports Science Metrics</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Calculates Brzycki and Wathan 1RM estimates with strict rep validity boundaries. Tracks 7-day acute to 28-day chronic workload ratio (ACWR) with safe divide-by-zero guards.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#131B2A] p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400 mb-4 border border-violet-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Enterprise Persistence</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Powered by PostgreSQL & Supabase with check constraints, UTC timestamps, SSL-encrypted pooling, and verified strict per-user data isolation.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-850 px-6 text-center text-xs text-slate-500">
        © 2026 MyFitSync. Built with pride for high-performance athletes and fitness enthusiasts.
      </footer>
    </div>
  );
};
