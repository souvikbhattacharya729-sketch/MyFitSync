import React from 'react';
import { Utensils, AlertTriangle } from 'lucide-react';

export const MacroDistribution = ({ todayNutrition }) => {
  if (!todayNutrition) return null;

  const {
    calories = 0,
    protein_g = 0,
    carbs_g = 0,
    fat_g = 0,
    target_calories = 2500,
    target_protein_g,
    calories_pct = 0,
    protein_pct,
    macro_split = {},
  } = todayNutrition;

  const discrepancyFlag = macro_split.discrepancy_flag;
  const discrepancyPct = macro_split.discrepancy_percentage;

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#131B2A] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Utensils className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Daily Nutrition</h3>
            <span className="text-[11px] text-slate-400">Calories & Macro Target Tracking</span>
          </div>
        </div>

        <span className="text-xs font-bold text-emerald-400">
          {calories} / {target_calories} kcal ({calories_pct}%)
        </span>
      </div>

      {/* Calorie Progress Bar */}
      <div className="space-y-1 mb-5">
        <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              calories_pct > 105 ? 'bg-amber-400' : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
            }`}
            style={{ width: `${Math.min(calories_pct, 100)}%` }}
          />
        </div>
      </div>

      {/* Macro Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Protein */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0B0F17]/50 p-3 text-center">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">Protein (4 kcal/g)</span>
          <div className="text-lg font-bold text-white mt-0.5">{protein_g}g</div>
          {target_protein_g ? (
            <span className="text-[10px] text-slate-400">{protein_pct}% of {target_protein_g}g</span>
          ) : (
            <span className="text-[10px] text-slate-500">{macro_split.protein_calories || 0} kcal</span>
          )}
        </div>

        {/* Carbs */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0B0F17]/50 p-3 text-center">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">Carbs (4 kcal/g)</span>
          <div className="text-lg font-bold text-white mt-0.5">{carbs_g}g</div>
          <span className="text-[10px] text-slate-500">{macro_split.carbs_calories || 0} kcal</span>
        </div>

        {/* Fat */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0B0F17]/50 p-3 text-center">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-400">Fat (9 kcal/g)</span>
          <div className="text-lg font-bold text-white mt-0.5">{fat_g}g</div>
          <span className="text-[10px] text-slate-500">{macro_split.fat_calories || 0} kcal</span>
        </div>
      </div>

      {/* Discrepancy Notice if > 10% */}
      {discrepancyFlag && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            Notice: Logged calories ({calories}) differ from macro-derived calories ({macro_split.derived_calories}) by {discrepancyPct}%.
          </span>
        </div>
      )}
    </div>
  );
};
