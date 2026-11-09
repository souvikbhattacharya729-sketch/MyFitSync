import React from 'react';

export const Skeleton = ({ className = '', height = 'h-6', width = 'w-full' }) => (
  <div className={`animate-pulse rounded bg-slate-800 ${height} ${width} ${className}`} />
);

export const CardSkeleton = () => (
  <div className="rounded-2xl border border-slate-800 bg-[#131B2A] p-5 shadow-sm animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 w-28 rounded bg-slate-800"></div>
      <div className="h-8 w-8 rounded-xl bg-slate-800"></div>
    </div>
    <div className="h-8 w-36 rounded bg-slate-800 mb-2"></div>
    <div className="h-3 w-20 rounded bg-slate-800"></div>
  </div>
);

export const ChartSkeleton = ({ height = "h-72" }) => (
  <div className={`rounded-2xl border border-slate-800 bg-[#131B2A] p-5 shadow-sm animate-pulse flex flex-col justify-between ${height}`}>
    <div className="flex justify-between items-center mb-4">
      <div className="h-5 w-40 rounded bg-slate-800"></div>
      <div className="h-8 w-24 rounded bg-slate-800"></div>
    </div>
    <div className="flex-1 flex items-end gap-3 pt-6">
      <div className="h-1/3 flex-1 rounded bg-slate-800"></div>
      <div className="h-2/3 flex-1 rounded bg-slate-800"></div>
      <div className="h-1/2 flex-1 rounded bg-slate-800"></div>
      <div className="h-4/5 flex-1 rounded bg-slate-800"></div>
      <div className="h-3/5 flex-1 rounded bg-slate-800"></div>
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="rounded-2xl border border-slate-800 bg-[#131B2A] p-5 shadow-sm animate-pulse">
    <div className="h-6 w-48 rounded bg-slate-800 mb-6"></div>
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-800/60">
          <div className="h-4 w-32 rounded bg-slate-800"></div>
          <div className="h-4 w-20 rounded bg-slate-800"></div>
          <div className="h-4 w-16 rounded bg-slate-800"></div>
          <div className="h-4 w-12 rounded bg-slate-800"></div>
        </div>
      ))}
    </div>
  </div>
);

export default Skeleton;
