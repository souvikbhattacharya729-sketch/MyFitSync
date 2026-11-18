import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, MessageSquareCode, Gauge, ShieldCheck, Flame, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { Card3D } from '../components/common/Card3D';

export const Landing = () => {
  return (
    <div className="min-h-screen bg-sage-bg text-sage-forest flex flex-col selection:bg-sage-mint selection:text-sage-forest">
      {/* Top Navbar */}
      <header className="flex h-20 items-center justify-between px-6 md:px-12 max-w-7xl mx-auto w-full border-b border-sage-border bg-white/70 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sage-mint text-sage-action border border-sage-sage/30 shadow-sm">
            <Activity className="h-6 w-6" />
          </div>
          <span className="text-xl font-black text-sage-forest tracking-tight">
            MyFitSync
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-xl px-4 py-2 text-sm font-bold text-sage-forest hover:bg-sage-surface transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-sage-action hover:bg-sage-forest px-5 py-2.5 text-sm font-bold text-white shadow-card active:scale-95 transition-all"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 md:px-6 py-20 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-sage-sage/40 bg-sage-mint/50 px-4 py-1.5 text-xs font-bold text-sage-forest mb-8 shadow-sm">
          <Zap className="h-3.5 w-3.5 text-sage-action fill-sage-action" />
          <span>Next-Gen Deterministic NLP Fitness Intelligence</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-sage-forest max-w-4xl leading-[1.1]">
          Your Personal Fitness <span className="text-sage-action">Intelligence</span>.
        </h1>

        <p className="mt-6 text-base sm:text-lg md:text-xl text-sage-muted max-w-2xl font-normal leading-relaxed">
          Log full workouts, nutrition, and recovery in plain English. No tedious dropdowns or manual counters. Real sports science analytics computed instantly.
        </p>

        {/* 3D Demo prompt bubble */}
        <Card3D className="mt-10 w-full max-w-2xl rounded-2xl border border-sage-border bg-white p-5 shadow-card text-left">
          <div className="flex items-center justify-between text-xs text-sage-muted mb-2 font-mono">
            <span>Natural language input:</span>
            <span className="text-sage-action font-bold">Processed in 1 transaction</span>
          </div>
          <div className="rounded-xl bg-sage-surface p-3.5 text-sm text-sage-forest border border-sage-border font-mono font-medium">
            "Squats 100 kg 5 reps 3 sets at RPE 8, bench 70 kg for 8 reps x 3, ate 2200 kcal with 160 g protein, slept 7 hours."
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-sage-forest">
            <span className="rounded-lg bg-sage-mint text-sage-action px-2.5 py-1 border border-sage-sage/30">✓ 2 Workouts Logged</span>
            <span className="rounded-lg bg-sage-surface text-sage-forest px-2.5 py-1 border border-sage-border">✓ 2200 kcal / 160g Protein</span>
            <span className="rounded-lg bg-sage-mint text-sage-action px-2.5 py-1 border border-sage-sage/30">✓ 7h Recovery Saved</span>
          </div>
        </Card3D>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            to="/register"
            className="flex items-center justify-center gap-2 rounded-xl bg-sage-action hover:bg-sage-forest px-8 py-3.5 text-base font-bold text-white shadow-card active:scale-95 transition-all"
          >
            <span>Start Logging Free</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 rounded-xl border border-sage-border bg-white px-8 py-3.5 text-base font-bold text-sage-forest hover:bg-sage-surface transition-colors shadow-sm"
          >
            Sign In to Dashboard
          </Link>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-20 border-t border-sage-border bg-white px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card3D className="rounded-2xl border border-sage-border bg-sage-surface/60 p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-mint text-sage-action mb-4 border border-sage-sage/30">
              <MessageSquareCode className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-sage-forest mb-2">Plain English NLP</h3>
            <p className="text-sm text-sage-muted leading-relaxed">
              Deterministic rule-based conversational engine. Recognizes complex multi-set reps, pounds-to-kg conversions, RPE, and handles ambiguities via quick clarification chips.
            </p>
          </Card3D>

          <Card3D className="rounded-2xl border border-sage-border bg-sage-surface/60 p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-mint text-sage-action mb-4 border border-sage-sage/30">
              <Gauge className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-sage-forest mb-2">Sports Science Metrics</h3>
            <p className="text-sm text-sage-muted leading-relaxed">
              Acute:Chronic Workload Ratio (ACWR) injury prevention, Brzycki estimated 1-Rep Max curves, and volume periodization graphs.
            </p>
          </Card3D>

          <Card3D className="rounded-2xl border border-sage-border bg-sage-surface/60 p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-mint text-sage-action mb-4 border border-sage-sage/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-sage-forest mb-2">User Isolation & Privacy</h3>
            <p className="text-sm text-sage-muted leading-relaxed">
              Row-level UUID tenancy with 404 security boundaries. Cryptographic token auth, zero tracking leaks, and complete data ownership.
            </p>
          </Card3D>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sage-border bg-white px-6 md:px-12 py-8 text-center text-xs text-sage-muted">
        <p>© 2026 MyFitSync. Your Personal Fitness Intelligence. All rights reserved.</p>
      </footer>
    </div>
  );
};
