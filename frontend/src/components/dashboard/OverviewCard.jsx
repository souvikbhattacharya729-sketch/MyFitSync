import React from 'react';
import { Card3D } from '../common/Card3D';

export const OverviewCard = ({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  color = 'sage',
}) => {
  const colorMap = {
    sage: 'text-[#263D32] bg-[#DCEFE3] border-[#A8D5B5]/60',
    forest: 'text-white bg-[#263D32] border-[#263D32]',
    action: 'text-white bg-[#6BA985] border-[#6BA985]',
    mint: 'text-[#263D32] bg-[#EDF5EF] border-[#DCEFE3]',
    lime: 'text-[#263D32] bg-[#DCEFE3] border-[#A8D5B5]/60',
    cyan: 'text-[#263D32] bg-[#EDF5EF] border-[#A8D5B5]/60',
    violet: 'text-[#263D32] bg-[#DCEFE3] border-[#A8D5B5]/60',
    amber: 'text-[#8A5A12] bg-[#FDF5E6] border-[#F2DEB5]',
    rose: 'text-[#963737] bg-[#FDF0EE] border-[#F2C4BE]',
  };

  const badgeStyle = colorMap[color] || colorMap.sage;

  return (
    <Card3D className="p-5 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#77847C]">{title}</span>
        {Icon && (
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl border ${badgeStyle} shadow-sm transition-transform duration-300`}
            style={{ transform: 'translateZ(15px)' }}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div style={{ transform: 'translateZ(10px)' }}>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl md:text-3xl font-black tracking-tight text-[#263D32]">{value}</span>
          {unit && <span className="text-xs font-bold text-[#77847C]">{unit}</span>}
        </div>

        {subtitle && <p className="mt-1.5 text-xs text-[#77847C] font-medium truncate">{subtitle}</p>}
      </div>
    </Card3D>
  );
};
