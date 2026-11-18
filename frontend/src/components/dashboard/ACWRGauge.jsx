import React from 'react';
import { Info, Gauge } from 'lucide-react';
import { Card3D } from '../common/Card3D';

export const ACWRGauge = ({ acwrData }) => {
  if (!acwrData) return null;

  const { acwr, acute_load, chronic_load, status, zone, days_of_history, disclaimer } = acwrData;

  const isCalculated = status === 'calculated' && acwr !== null;

  const zoneConfig = {
    underreaching: { label: 'Underreaching (<0.8)', color: 'text-[#8A5A12]', bg: 'bg-[#FDF5E6]', bar: 'bg-[#E8C99B]' },
    optimal: { label: 'Optimal Load (0.8 - 1.3)', color: 'text-[#263D32]', bg: 'bg-[#DCEFE3]', bar: 'bg-[#6BA985]' },
    high_risk: { label: 'Elevated Fatigue (1.3 - 1.5)', color: 'text-[#8A5A12]', bg: 'bg-[#FDF5E6]', bar: 'bg-[#E8C99B]' },
    overreaching: { label: 'Overreaching (>1.5)', color: 'text-[#963737]', bg: 'bg-[#FDF0EE]', bar: 'bg-[#E8B4B4]' },
    insufficient_data: { label: 'Insufficient Data', color: 'text-[#77847C]', bg: 'bg-[#EDF5EF]', bar: 'bg-[#E5EDE7]' },
  };

  const currentZone = zoneConfig[zone] || zoneConfig.insufficient_data;

  // Percentage for gauge needle / bar (clamped 0 to 100%)
  const percentage = isCalculated ? Math.min(Math.max((acwr / 2.0) * 100, 5), 100) : 0;

  return (
    <Card3D className="p-6 text-[#263D32] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#DCEFE3] text-[#263D32] border border-[#A8D5B5]/50 shadow-sm">
              <Gauge className="h-4 w-4 text-[#6BA985]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#263D32]">Workload Balance (ACWR)</h3>
              <span className="text-[11px] text-[#77847C]">Acute (7d) vs Chronic (28d) Fatigue Balance</span>
            </div>
          </div>

          <span className={`rounded-xl px-2.5 py-1 text-xs font-bold border border-current/20 ${currentZone.color} ${currentZone.bg}`}>
            {currentZone.label}
          </span>
        </div>

        {isCalculated ? (
          <div className="space-y-4 my-2">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-[#263D32] tracking-tight">{acwr.toFixed(2)}</span>
                <span className="text-xs font-bold text-[#77847C]">ratio</span>
              </div>
              <div className="text-right text-xs text-[#77847C] space-y-0.5">
                <div>Acute 7d: <strong className="text-[#263D32] font-semibold">{acute_load} kg/day</strong></div>
                <div>Chronic 28d: <strong className="text-[#263D32] font-semibold">{chronic_load} kg/day</strong></div>
              </div>
            </div>

            {/* Visual Scale Indicator */}
            <div className="relative pt-1 pb-2">
              <div className="h-3 w-full rounded-full bg-[#EDF5EF] overflow-hidden flex border border-[#E5EDE7]">
                <div className="h-full w-[40%] bg-[#FDF5E6] border-r border-[#E5EDE7]" title="Underreaching (<0.8)"></div>
                <div className="h-full w-[25%] bg-[#DCEFE3] border-r border-[#E5EDE7]" title="Optimal (0.8 - 1.3)"></div>
                <div className="h-full w-[10%] bg-[#FDF5E6] border-r border-[#E5EDE7]" title="Elevated (1.3 - 1.5)"></div>
                <div className="h-full w-[25%] bg-[#FDF0EE]" title="Overreaching (>1.5)"></div>
              </div>

              {/* Needle marker in Action Green */}
              <div
                className="absolute top-0 -mt-0.5 h-5 w-2.5 rounded-full bg-[#6BA985] shadow-md shadow-[#6BA985]/40 transition-all duration-500 border border-white"
                style={{ left: `calc(${percentage}% - 5px)` }}
                aria-label={`Current ACWR marker at ${acwr}`}
              />
            </div>

            <div className="flex justify-between text-[10px] text-[#77847C] font-mono">
              <span>0.0 (Low)</span>
              <span>0.8</span>
              <span className="text-[#263D32] font-bold">1.3 (Optimal)</span>
              <span>1.5</span>
              <span>2.0+ (Fatigue)</span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-[#F6FAF7] p-4 text-center my-3 border border-[#E5EDE7]">
            <p className="text-xs text-[#263D32] font-bold mb-1">Building Workload Baseline</p>
            <p className="text-[11px] text-[#77847C] leading-relaxed">
              {days_of_history < 14
                ? `${days_of_history}/14 days of historical logs recorded. ACWR requires at least 14 days of data to prevent erroneous ratios.`
                : "Chronic load is currently zero. Continue logging workouts to generate your ACWR ratio."}
            </p>
          </div>
        )}
      </div>

      {/* Mandatory Clinical Disclaimer */}
      <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-[#F6FAF7] p-3 text-[11px] leading-relaxed text-[#77847C] border border-[#E5EDE7]">
        <Info className="h-4 w-4 shrink-0 text-[#6BA985] mt-0.5" />
        <p>{disclaimer}</p>
      </div>
    </Card3D>
  );
};
