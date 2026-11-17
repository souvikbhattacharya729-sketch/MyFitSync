import React from 'react';

export const OverviewCard = ({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  color = 'lime',
}) => {
  const colorMap = {
    lime: 'text-[#C6FF3D] bg-[#C6FF3D]/10 border-[#C6FF3D]/25 shadow-[#C6FF3D]/5',
    emerald: 'text-[#3DDC84] bg-[#3DDC84]/10 border-[#3DDC84]/25 shadow-[#3DDC84]/5',
    cyan: 'text-[#4DA3FF] bg-[#4DA3FF]/10 border-[#4DA3FF]/25 shadow-[#4DA3FF]/5',
    violet: 'text-[#8B5CF6] bg-[#8B5CF6]/10 border-[#8B5CF6]/25 shadow-[#8B5CF6]/5',
    amber: 'text-[#FFB020] bg-[#FFB020]/10 border-[#FFB020]/25 shadow-[#FFB020]/5',
    rose: 'text-[#FF5A5F] bg-[#FF5A5F]/10 border-[#FF5A5F]/25 shadow-[#FF5A5F]/5',
  };

  const badgeStyle = colorMap[color] || colorMap.lime;

  return (
    <div className="rounded-2xl border border-[#20252E] bg-[#161A21] p-5 shadow-sm hover:border-[#C6FF3D]/40 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#9AA3B2]">{title}</span>
        {Icon && (
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${badgeStyle} shadow-sm`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl md:text-3xl font-black tracking-tight text-[#F5F7FA]">{value}</span>
        {unit && <span className="text-xs font-bold text-[#9AA3B2]">{unit}</span>}
      </div>

      {subtitle && <p className="mt-1.5 text-xs text-[#9AA3B2] font-medium">{subtitle}</p>}
    </div>
  );
};
