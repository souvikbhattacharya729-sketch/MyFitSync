import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Card3D } from '../common/Card3D';

export const VolumeChart = ({ volumeData = [] }) => {
  const maxVolume = volumeData.length > 0 ? Math.max(...volumeData.map((d) => d.volume_kg || 0)) : 1000;

  return (
    <Card3D className="rounded-2xl border border-sage-border bg-white p-5 shadow-card text-sage-forest">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-mint text-sage-action border border-sage-sage/30 shadow-sm" style={{ transform: 'translateZ(15px)' }}>
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-sage-forest">Training Volume</h3>
            <span className="text-[11px] text-sage-muted">Total Tonnage (Weight × Reps × Sets)</span>
          </div>
        </div>
      </div>

      {volumeData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-sage-muted">
          <p className="text-xs">No volume data logged for this period.</p>
        </div>
      ) : (
        <div className="space-y-3" role="img" aria-label="Training volume chart">
          <div className="h-44 w-full flex items-end gap-2.5 pt-6 pb-2 px-1 border-b border-sage-border">
            {volumeData.map((item, idx) => {
              const heightPct = Math.min(Math.max(((item.volume_kg || 0) / maxVolume) * 100, 10), 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-white border border-sage-border px-2.5 py-1 rounded-lg text-[10px] text-sage-forest font-medium whitespace-nowrap z-10 pointer-events-none shadow-float">
                    {item.volume_kg} kg
                  </div>

                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[32px] rounded-t-lg bg-gradient-to-t from-sage-sage to-sage-action group-hover:brightness-110 transition-all shadow-sm"
                  />
                  <span className="text-[10px] text-sage-muted font-mono truncate max-w-[36px]">
                    {item.label || item.date?.split('-').slice(1).join('/')}
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
