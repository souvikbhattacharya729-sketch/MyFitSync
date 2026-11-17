import React from 'react';
import { Info, Gauge } from 'lucide-react';

export const ACWRGauge = ({ acwrData }) => {
  if (!acwrData) return null;

  const { acwr, acute_load, chronic_load, status, zone, days_of_history, disclaimer } = acwrData;

  const isCalculated = status === 'calculated' && acwr !== null;

  const zoneConfig = {
    underreaching: { label: 'Underreaching (<0.8)', color: 'text-[#FFB020]', bg: 'bg-[#FFB020]/15', bar: 'bg-[#FFB020]' },
    optimal: { label: 'Optimal Load (0.8 - 1.3)', color: 'text-[#C6FF3D]', bg: 'bg-[#C6FF3D]/15', bar: 'bg-[#C6FF3D]' },
    high_risk: { label: 'Elevated Fatigue (1.3 - 1.5)', color: 'text-[#FFB020]', bg: 'bg-[#FFB020]/20', bar: 'bg-[#FFB020]' },
    overreaching: { label: 'Overreaching (>1.5)', color: 'text-[#FF5A5F]', bg: 'bg-[#FF5A5F]/20', bar: 'bg-[#FF5A5F]' },
    insufficient_data: { label: 'Insufficient Data', color: 'text-[#9AA3B2]', bg: 'bg-[#20252E]', bar: 'bg-[#20252E]' },
  };

  const currentZone = zoneConfig[zone] || zoneConfig.insufficient_data;

  // Percentage for gauge needle / bar (clamped 0 to 100%)
  const percentage = isCalculated ? Math.min(Math.max((acwr / 2.0) * 100, 5), 100) : 0;

  return (
    <div className="rounded-2xl border border-[#20252E] bg-[#161A21] p-5 shadow-sm text-[#F5F7FA]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#4DA3FF]/10 text-[#4DA3FF] border border-[#4DA3FF]/20">
            <Gauge className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F5F7FA]">Workload Balance (ACWR)</h3>
            <span className="text-[11px] text-[#9AA3B2]">Acute (7d) vs Chronic (28d) Fatigue Balance</span>
          </div>
        </div>

        <span className={`rounded-xl px-2.5 py-1 text-xs font-black border border-current ${currentZone.color} ${currentZone.bg}`}>
          {currentZone.label}
        </span>
      </div>

      {isCalculated ? (
        <div className="space-y-4 my-2">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-[#F5F7FA] tracking-tight">{acwr.toFixed(2)}</span>
              <span className="text-xs font-bold text-[#9AA3B2]">ratio</span>
            </div>
            <div className="text-right text-xs text-[#9AA3B2]">
              <div>Acute 7d: <strong className="text-[#F5F7FA]">{acute_load} kg/day</strong></div>
              <div>Chronic 28d: <strong className="text-[#F5F7FA]">{chronic_load} kg/day</strong></div>
            </div>
          </div>

          {/* Visual Scale Indicator */}
          <div className="relative">
            <div className="h-3 w-full rounded-full bg-[#20252E] overflow-hidden flex">
              <div className="h-full w-[40%] bg-[#FFB020]/40 border-r border-[#0B0D10]" title="Underreaching (<0.8)"></div>
              <div className="h-full w-[25%] bg-[#C6FF3D]/50 border-r border-[#0B0D10]" title="Optimal (0.8 - 1.3)"></div>
              <div className="h-full w-[10%] bg-[#FFB020]/50 border-r border-[#0B0D10]" title="Elevated (1.3 - 1.5)"></div>
              <div className="h-full w-[25%] bg-[#FF5A5F]/50" title="Overreaching (>1.5)"></div>
            </div>

            {/* Needle marker in Electric Lime */}
            <div
              className="absolute top-0 -mt-1 h-5 w-2 rounded-full bg-[#C6FF3D] shadow-lg shadow-[#C6FF3D]/80 transition-all duration-500"
              style={{ left: `${percentage}%` }}
              aria-label={`Current ACWR marker at ${acwr}`}
            />
          </div>

          <div className="flex justify-between text-[10px] text-[#9AA3B2] font-mono">
            <span>0.0 (Low)</span>
            <span>0.8</span>
            <span className="text-[#C6FF3D] font-bold">1.3 (Optimal)</span>
            <span>1.5</span>
            <span>2.0+ (High Fatigue)</span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-[#20252E] p-4 text-center my-3 border border-[#20252E]">
          <p className="text-xs text-[#F5F7FA] font-bold mb-1">Building Workload Baseline</p>
          <p className="text-[11px] text-[#9AA3B2]">
            {days_of_history < 14
              ? `${days_of_history}/14 days of historical logs recorded. ACWR requires at least 14 days of data to prevent erroneous ratios.`
              : "Chronic load is currently zero. Continue logging workouts to generate your ACWR ratio."}
          </p>
        </div>
      )}

      {/* Mandatory Clinical Disclaimer */}
      <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#20252E] p-3 text-[11px] leading-relaxed text-[#9AA3B2] border border-[#20252E]">
        <Info className="h-4 w-4 shrink-0 text-[#4DA3FF] mt-0.5" />
        <p>{disclaimer}</p>
      </div>
    </div>
  );
};
