import React, { useState } from 'react';
import { Dumbbell, Table, TrendingUp } from 'lucide-react';

const LIFTS = [
  { id: 'squat', label: 'Squat' },
  { id: 'bench_press', label: 'Bench Press' },
  { id: 'deadlift', label: 'Deadlift' },
  { id: 'overhead_press', label: 'Overhead Press' },
];

export const StrengthChart = ({ strengthTrends = [] }) => {
  const [selectedLift, setSelectedLift] = useState('bench_press');
  const [showTable, setShowTable] = useState(false);

  const filtered = strengthTrends.filter(
    (item) => item.exercise === selectedLift && item.estimated_1rm
  );

  const max1rm = filtered.length > 0 ? Math.max(...filtered.map((d) => d.estimated_1rm)) : 0;
  const min1rm = filtered.length > 0 ? Math.min(...filtered.map((d) => d.estimated_1rm)) : 0;

  return (
    <div className="rounded-2xl border border-[#20252E] bg-[#161A21] p-5 shadow-sm text-[#F5F7FA]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#4DA3FF]/10 text-[#4DA3FF] border border-[#4DA3FF]/20">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F5F7FA]">Strength Progression (E1RM)</h3>
            <span className="text-[11px] text-[#9AA3B2]">Estimated 1-Rep Max Trends Over Time</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Lift Filter Tabs */}
          <div className="flex rounded-xl bg-[#0B0D10] p-1 border border-[#20252E]">
            {LIFTS.map((lift) => (
              <button
                key={lift.id}
                onClick={() => setSelectedLift(lift.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  selectedLift === lift.id
                    ? 'bg-[#C6FF3D] text-[#0B0D10] font-black shadow-sm'
                    : 'text-[#9AA3B2] hover:text-[#F5F7FA]'
                }`}
              >
                {lift.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowTable(!showTable)}
            className={`rounded-xl border p-1.5 transition-colors ${
              showTable
                ? 'border-[#C6FF3D] text-[#C6FF3D] bg-[#C6FF3D]/10'
                : 'border-[#20252E] text-[#9AA3B2] hover:text-[#F5F7FA] hover:bg-[#20252E]'
            }`}
            title="Toggle Accessible Data Table Alternative"
            aria-label="Toggle Data Table View"
          >
            <Table className="h-4 w-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-[#9AA3B2]">
          <Dumbbell className="h-8 w-8 text-[#9AA3B2]/40 mb-2" />
          <p className="text-xs">No recorded sets for {selectedLift.replace('_', ' ')} yet.</p>
        </div>
      ) : showTable ? (
        /* Accessible Table Alternative */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#9AA3B2]">
            <thead className="border-b border-[#20252E] text-[#9AA3B2] uppercase text-[10px]">
              <tr>
                <th className="py-2">Date</th>
                <th className="py-2">Weight (kg)</th>
                <th className="py-2">Reps</th>
                <th className="py-2">Sets</th>
                <th className="py-2">RPE</th>
                <th className="py-2 font-bold text-[#C6FF3D]">E1RM (kg)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#20252E]">
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td className="py-2 font-mono text-[#F5F7FA]">{row.date}</td>
                  <td className="py-2 text-[#F5F7FA]">{row.weight_kg}</td>
                  <td className="py-2">{row.reps}</td>
                  <td className="py-2">{row.sets}</td>
                  <td className="py-2">{row.rpe ?? '-'}</td>
                  <td className="py-2 font-black text-[#C6FF3D]">{row.estimated_1rm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Responsive Line/Bar Visual with Secondary & Accent Colors */
        <div className="space-y-3" role="img" aria-label={`E1RM progression chart for ${selectedLift}`}>
          <div className="flex justify-between text-xs text-[#9AA3B2] font-mono">
            <span>Peak: <strong className="text-[#C6FF3D]">{max1rm} kg</strong></span>
            <span>Baseline: <strong className="text-[#4DA3FF]">{min1rm} kg</strong></span>
          </div>

          <div className="h-48 w-full flex items-end gap-2 pt-6 pb-2 px-2 border-b border-[#20252E]">
            {filtered.map((item, idx) => {
              const range = max1rm - min1rm || 1;
              const heightPct = Math.max(((item.estimated_1rm - min1rm) / range) * 100, 15);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-[#0B0D10] border border-[#20252E] px-2 py-1 rounded text-[10px] text-[#F5F7FA] whitespace-nowrap z-10 pointer-events-none shadow-lg">
                    {item.estimated_1rm} kg ({item.date})
                  </div>

                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-[#4DA3FF] to-[#C6FF3D] group-hover:brightness-125 transition-all shadow-md shadow-[#C6FF3D]/10"
                  />
                  <span className="text-[10px] text-[#9AA3B2] font-mono rotate-45 origin-left truncate max-w-[32px]">
                    {item.date.split('-').slice(1).join('/')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
