import React, { useState } from 'react';
import { Dumbbell, Table, TrendingUp } from 'lucide-react';
import { Card3D } from '../common/Card3D';

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
    <Card3D className="rounded-2xl border border-sage-border bg-white p-5 shadow-card text-sage-forest">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-mint text-sage-action border border-sage-sage/30 shadow-sm" style={{ transform: 'translateZ(15px)' }}>
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-sage-forest">Strength Progression (E1RM)</h3>
            <span className="text-[11px] text-sage-muted">Estimated 1-Rep Max Trends Over Time</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Lift Filter Tabs */}
          <div className="flex rounded-xl bg-sage-bg p-1 border border-sage-border">
            {LIFTS.map((lift) => (
              <button
                key={lift.id}
                onClick={() => setSelectedLift(lift.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  selectedLift === lift.id
                    ? 'bg-sage-action text-white font-bold shadow-sm'
                    : 'text-sage-muted hover:text-sage-forest'
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
                ? 'border-sage-action text-sage-action bg-sage-mint'
                : 'border-sage-border text-sage-muted hover:text-sage-forest hover:bg-sage-bg'
            }`}
            title="Toggle Accessible Data Table Alternative"
            aria-label="Toggle Data Table View"
          >
            <Table className="h-4 w-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-sage-muted">
          <Dumbbell className="h-8 w-8 text-sage-muted/40 mb-2" />
          <p className="text-xs">No recorded sets for {selectedLift.replace('_', ' ')} yet.</p>
        </div>
      ) : showTable ? (
        /* Accessible Table Alternative */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-sage-muted">
            <thead className="border-b border-sage-border text-sage-muted uppercase text-[10px]">
              <tr>
                <th className="py-2.5">Date</th>
                <th className="py-2.5">Weight (kg)</th>
                <th className="py-2.5">Reps</th>
                <th className="py-2.5">Sets</th>
                <th className="py-2.5">RPE</th>
                <th className="py-2.5 font-bold text-sage-action">E1RM (kg)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-border">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-sage-surface/50 transition-colors">
                  <td className="py-2 font-mono text-sage-forest">{row.date}</td>
                  <td className="py-2 text-sage-forest font-medium">{row.weight_kg}</td>
                  <td className="py-2">{row.reps}</td>
                  <td className="py-2">{row.sets}</td>
                  <td className="py-2">{row.rpe ?? '-'}</td>
                  <td className="py-2 font-black text-sage-action">{row.estimated_1rm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Responsive Line/Bar Visual with Secondary & Accent Colors */
        <div className="space-y-3" role="img" aria-label={`E1RM progression chart for ${selectedLift}`}>
          <div className="flex justify-between text-xs text-sage-muted font-mono">
            <span>Peak: <strong className="text-sage-action">{max1rm} kg</strong></span>
            <span>Baseline: <strong className="text-sage-forest">{min1rm} kg</strong></span>
          </div>

          <div className="h-48 w-full flex items-end gap-2 pt-6 pb-2 px-2 border-b border-sage-border">
            {filtered.map((item, idx) => {
              const range = max1rm - min1rm || 1;
              const heightPct = Math.max(((item.estimated_1rm - min1rm) / range) * 100, 15);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-white border border-sage-border px-2.5 py-1 rounded-lg text-[10px] text-sage-forest font-medium whitespace-nowrap z-10 pointer-events-none shadow-float">
                    {item.estimated_1rm} kg ({item.date})
                  </div>

                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-sage-sage to-sage-action group-hover:brightness-110 transition-all shadow-sm"
                  />
                  <span className="text-[10px] text-sage-muted font-mono rotate-45 origin-left truncate max-w-[32px]">
                    {item.date.split('-').slice(1).join('/')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card3D>
  );
};
