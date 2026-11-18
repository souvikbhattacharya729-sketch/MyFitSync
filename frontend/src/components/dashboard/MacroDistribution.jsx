import React from 'react';
import { Utensils, AlertTriangle } from 'lucide-react';
import { Card3D } from '../common/Card3D';

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
    <Card3D className="p-6 text-[#263D32] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#DCEFE3] text-[#263D32] border border-[#A8D5B5]/50 shadow-sm">
              <Utensils className="h-4 w-4 text-[#6BA985]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#263D32]">Daily Nutrition</h3>
              <span className="text-[11px] text-[#77847C]">Calories & Macro Target Tracking</span>
            </div>
          </div>

          <span className="text-xs font-black text-[#263D32] bg-[#EDF5EF] px-3 py-1 rounded-xl border border-[#E5EDE7]">
            {calories} / {target_calories} kcal ({calories_pct}%)
          </span>
        </div>

        {/* Calorie Progress Bar */}
        <div className="space-y-1 mb-5">
          <div className="h-2.5 w-full rounded-full bg-[#EDF5EF] overflow-hidden border border-[#E5EDE7]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                calories_pct > 105 ? 'bg-[#D99B4B]' : 'bg-[#6BA985]'
              }`}
              style={{ width: `${Math.min(calories_pct, 100)}%` }}
            />
          </div>
        </div>

        {/* Macro Grid with 3D Depth */}
        <div className="grid grid-cols-3 gap-3">
          {/* Protein */}
          <div className="rounded-xl border border-[#A8D5B5]/60 bg-[#DCEFE3]/50 p-3 text-center shadow-inner-mint">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#263D32]">Protein (4 kcal/g)</span>
            <div className="text-lg font-black text-[#263D32] mt-0.5">{protein_g}g</div>
            {target_protein_g ? (
              <span className="text-[10px] text-[#77847C]">{protein_pct}% of {target_protein_g}g</span>
            ) : (
              <span className="text-[10px] text-[#77847C]">{macro_split.protein_calories || 0} kcal</span>
            )}
          </div>

          {/* Carbs */}
          <div className="rounded-xl border border-[#E5EDE7] bg-[#F6FAF7] p-3 text-center shadow-inner-mint">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#263D32]">Carbs (4 kcal/g)</span>
            <div className="text-lg font-black text-[#263D32] mt-0.5">{carbs_g}g</div>
            <span className="text-[10px] text-[#77847C]">{macro_split.carbs_calories || 0} kcal</span>
          </div>

          {/* Fat */}
          <div className="rounded-xl border border-[#E5EDE7] bg-[#F6FAF7] p-3 text-center shadow-inner-mint">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#263D32]">Fat (9 kcal/g)</span>
            <div className="text-lg font-black text-[#263D32] mt-0.5">{fat_g}g</div>
            <span className="text-[10px] text-[#77847C]">{macro_split.fat_calories || 0} kcal</span>
          </div>
        </div>
      </div>

      {/* Discrepancy Warning Flag if Atwater math deviates > 10% */}
      {discrepancyFlag && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#E8C99B] bg-[#FDF5E6] p-2.5 text-xs text-[#8A5A12]">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-[#8A5A12]" />
          <div>
            <span className="font-semibold">Atwater Caloric Warning:</span> Logged calories ({calories}) differ from macro-derived calories ({macro_split.macro_derived_calories || (protein_g * 4 + carbs_g * 4 + fat_g * 9)}) by {discrepancyPct}%.
          </div>
        </div>
      )}
    </Card3D>
  );
};
