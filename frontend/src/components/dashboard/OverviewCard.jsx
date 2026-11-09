import React from 'react';

export const OverviewCard = ({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  color = 'emerald',
}) => {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 shadow-cyan-500/10',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20 shadow-violet-500/10',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-amber-500/10',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-rose-500/10',
  };

  const badgeStyle = colorMap[color] || colorMap.emerald;

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#131B2A] p-5 shadow-sm hover:border-slate-700 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${badgeStyle} shadow-sm`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">{value}</span>
        {unit && <span className="text-xs font-semibold text-slate-400">{unit}</span>}
      </div>

      {subtitle && <p className="mt-1.5 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
};
