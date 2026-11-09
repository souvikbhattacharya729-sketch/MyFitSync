import React from 'react';
import { ShieldAlert, Info, Gauge } from 'lucide-react';

export const ACWRGauge = ({ acwrData }) => {
  if (!acwrData) return null;

  const { acwr, acute_load, chronic_load, status, zone, days_of_history, disclaimer } = acwrData;

  const isCalculated = status === 'calculated' && acwr !== null;

  const zoneConfig = {
    underreaching: { label: 'Underreaching (<0.8)', color: 'text-amber-400', bg: 'bg-amber-500/20', bar: 'bg-amber-400' },
    optimal: { label: 'Optimal Load (0.8 - 1.3)', color: 'text-emerald-400', bg: 'bg-emerald-500/20', bar: 'bg-emerald-400' },
    high_risk: { label: 'Elevated Fatigue (1.3 - 1.5)', color: 'text-amber-500', bg: 'bg-amber-500/20', bar: 'bg-amber-500' },
    overreaching: { label: 'Overreaching (>1.5)', color: 'text-rose-500', bg: 'bg-rose-500/20', bar: 'bg-rose-500' },
    insufficient_data: { label: 'Insufficient Data', color: 'text-slate-400', bg: 'bg-slate-800', bar: 'bg-slate-700' },
  };

  const currentZone = zoneConfig[zone] || zoneConfig.insufficient_data;

  // Percentage for gauge needle / bar (clamped 0 to 100%)
  const percentage = isCalculated ? Math.min(Math.max((acwr / 2.0) * 100, 5), 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#131B2A] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Gauge className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Workload Balance (ACWR)</h3>
            <span className="text-[11px] text-slate-400">Acute (7d) vs Chronic (28d) Workload</span>
          </div>
        </div>

        <span className={`rounded-xl px-2.5 py-1 text-xs font-bold border ${currentZone.color} ${currentZone.bg}`}>
          {currentZone.label}
        </span>
      </div>

      {isCalculated ? (
        <div className="space-y-4 my-2">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white tracking-tight">{acwr.toFixed(2)}</span>
              <span className="text-xs font-semibold text-slate-400">ratio</span>
            </div>
            <div className="text-right text-xs text-slate-400">
              <div>Acute 7d: <strong className="text-slate-200">{acute_load} kg/day</strong></div>
              <div>Chronic 28d: <strong className="text-slate-200">{chronic_load} kg/day</strong></div>
            </div>
          </div>

          {/* Visual Scale Indicator */}
          <div className="relative">
            <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden flex">
              <div className="h-full w-[40%] bg-amber-400/30 border-r border-slate-900" title="Underreaching (<0.8)"></div>
              <div className="h-full w-[25%] bg-emerald-400/40 border-r border-slate-900" title="Optimal (0.8 - 1.3)"></div>
              <div className="h-full w-[10%] bg-amber-500/40 border-r border-slate-900" title="Elevated (1.3 - 1.5)"></div>
              <div className="h-full w-[25%] bg-rose-500/40" title="Overreaching (>1.5)"></div>
            </div>

            {/* Needle marker */}
            <div
              className="absolute top-0 -mt-1 h-5 w-1.5 rounded-full bg-white shadow-lg shadow-white/50 transition-all duration-500"
              style={{ left: `${percentage}%` }}
              aria-label={`Current ACWR marker at ${acwr}`}
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>0.0 (Low)</span>
            <span>0.8</span>
            <span className="text-emerald-400 font-bold">1.3</span>
            <span>1.5</span>
            <span>2.0+ (High)</span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-slate-900/60 p-4 text-center my-3 border border-slate-800">
          <p className="text-xs text-slate-300 font-medium mb-1">Building Workload Baseline</p>
          <p className="text-[11px] text-slate-400">
            {days_of_history < 14
              ? `${days_of_history}/14 days of historical logs recorded. ACWR requires at least 14 days of data to prevent erroneous ratios.`
              : "Chronic load is currently zero. Continue logging workouts to generate your ACWR ratio."}
          </p>
        </div>
      )}

      {/* Mandatory Disclaimer (Section 8 requirement) */}
      <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-900/80 p-3 text-[11px] leading-relaxed text-slate-400 border border-slate-800/80">
        <Info className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
        <p>{disclaimer}</p>
      </div>
    </div>
  );
};
