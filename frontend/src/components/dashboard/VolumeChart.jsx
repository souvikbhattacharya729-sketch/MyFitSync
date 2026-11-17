import React from 'react';
import { BarChart3 } from 'lucide-react';

export const VolumeChart = ({ volumeData = [] }) => {
  const maxVolume = volumeData.length > 0 ? Math.max(...volumeData.map((d) => d.volume_kg || 0)) : 1000;

  return (
    <div className="rounded-2xl border border-[#20252E] bg-[#161A21] p-5 shadow-sm text-[#F5F7FA]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#4DA3FF]/10 text-[#4DA3FF] border border-[#4DA3FF]/20">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F5F7FA]">Training Volume</h3>
            <span className="text-[11px] text-[#9AA3B2]">Total Tonnage (Weight × Reps × Sets)</span>
          </div>
        </div>
      </div>

      {volumeData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-[#9AA3B2]">
          <p className="text-xs">No volume data logged for this period.</p>
        </div>
      ) : (
        <div className="space-y-3" role="img" aria-label="Training volume chart">
          <div className="h-44 w-full flex items-end gap-2.5 pt-6 pb-2 px-1 border-b border-[#20252E]">
            {volumeData.map((item, idx) => {
              const heightPct = Math.min(Math.max(((item.volume_kg || 0) / maxVolume) * 100, 10), 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-[#0B0D10] border border-[#20252E] px-2 py-1 rounded text-[10px] text-[#F5F7FA] whitespace-nowrap z-10 pointer-events-none shadow-lg">
                    {item.volume_kg} kg
                  </div>

                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[32px] rounded-t-lg bg-gradient-to-t from-[#4DA3FF] to-[#C6FF3D] group-hover:brightness-125 transition-all shadow-md shadow-[#4DA3FF]/10"
                  />
                  <span className="text-[10px] text-[#9AA3B2] font-mono truncate max-w-[36px]">
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
