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
    <div className="rounded-2xl border border-[#20252E] bg-[#161A21] p-5 shadow-sm text-[#F5F7FA]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#C6FF3D]/10 text-[#C6FF3D] border border-[#C6FF3D]/20">
            <Utensils className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F5F7FA]">Daily Nutrition</h3>
            <span className="text-[11px] text-[#9AA3B2]">Calories & Macro Target Tracking</span>
          </div>
        </div>

        <span className="text-xs font-black text-[#C6FF3D]">
          {calories} / {target_calories} kcal ({calories_pct}%)
        </span>
      </div>

      {/* Calorie Progress Bar */}
      <div className="space-y-1 mb-5">
        <div className="h-2.5 w-full rounded-full bg-[#20252E] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              calories_pct > 105 ? 'bg-[#FFB020]' : 'bg-[#C6FF3D]'
            }`}
            style={{ width: `${Math.min(calories_pct, 100)}%` }}
          />
        </div>
      </div>

      {/* Macro Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Protein */}
        <div className="rounded-xl border border-[#20252E] bg-[#20252E] p-3 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C6FF3D]">Protein (4 kcal/g)</span>
          <div className="text-lg font-black text-[#F5F7FA] mt-0.5">{protein_g}g</div>
          {target_protein_g ? (
            <span className="text-[10px] text-[#9AA3B2]">{protein_pct}% of {target_protein_g}g</span>
          ) : (
            <span className="text-[10px] text-[#9AA3B2]">{macro_split.protein_calories || 0} kcal</span>
          )}
        </div>

        {/* Carbs */}
        <div className="rounded-xl border border-[#20252E] bg-[#20252E] p-3 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#4DA3FF]">Carbs (4 kcal/g)</span>
          <div className="text-lg font-black text-[#F5F7FA] mt-0.5">{carbs_g}g</div>
          <span className="text-[10px] text-[#9AA3B2]">{macro_split.carbs_calories || 0} kcal</span>
        </div>

        {/* Fat */}
        <div className="rounded-xl border border-[#20252E] bg-[#20252E] p-3 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFB020]">Fat (9 kcal/g)</span>
          <div className="text-lg font-black text-[#F5F7FA] mt-0.5">{fat_g}g</div>
          <span className="text-[10px] text-[#9AA3B2]">{macro_split.fat_calories || 0} kcal</span>
        </div>
      </div>

      {/* Discrepancy Warning Flag if Atwater math deviates > 10% */}
      {discrepancyFlag && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#FFB020]/30 bg-[#FFB020]/10 p-2.5 text-xs text-[#FFB020]">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-[#FFB020]" />
          <div>
            <span className="font-semibold">Atwater Caloric Warning:</span> Logged calories ({calories}) differ from macro-derived calories ({macro_split.macro_derived_calories || (protein_g * 4 + carbs_g * 4 + fat_g * 9)}) by {discrepancyPct}%.
          </div>
        </div>
      )}
    </div>
  );
};
