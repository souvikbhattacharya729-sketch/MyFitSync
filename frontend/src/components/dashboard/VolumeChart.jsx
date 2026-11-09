import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';

export const VolumeChart = ({ volumeData = [] }) => {
  const [groupBy, setGroupBy] = useState('weekly');

  const maxVolume = volumeData.length > 0 ? Math.max(...volumeData.map((d) => d.volume_kg || 0)) : 1000;

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#131B2A] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Training Volume</h3>
            <span className="text-[11px] text-slate-400">Total Tonnage (Weight × Reps × Sets)</span>
          </div>
        </div>
      </div>

      {volumeData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
          <p className="text-xs">No volume data logged for this period.</p>
        </div>
      ) : (
        <div className="space-y-3" role="img" aria-label="Training volume chart">
          <div className="h-44 w-full flex items-end gap-2.5 pt-6 pb-2 px-1 border-b border-slate-800">
            {volumeData.map((item, idx) => {
              const heightPct = Math.min(Math.max(((item.volume_kg || 0) / maxVolume) * 100, 10), 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 border border-slate-700 px-2 py-1 rounded text-[10px] text-white whitespace-nowrap z-10 pointer-events-none shadow-lg">
                    {item.volume_kg} kg
                  </div>

                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[32px] rounded-t-lg bg-gradient-to-t from-violet-600 to-indigo-400 group-hover:brightness-125 transition-all shadow-md shadow-violet-500/10"
                  />
                  <span className="text-[10px] text-slate-400 font-mono truncate max-w-[36px]">
                    {item.label || item.date?.split('-').slice(1).join('/')}
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
