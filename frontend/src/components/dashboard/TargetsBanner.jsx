import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, EyeOff, Info } from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';

export const TargetsBanner = () => {
  const { user, targetsData, loadingTargets } = useFitness();

  if (loadingTargets && !targetsData) {
    return (
      <div className="rounded-2xl border border-[#E5EDE7] bg-white p-5 animate-pulse shadow-sm">
        <div className="h-4 w-40 bg-[#EDF5EF] rounded mb-3"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="h-14 bg-[#EDF5EF] rounded-xl"></div>
          <div className="h-14 bg-[#EDF5EF] rounded-xl"></div>
          <div className="h-14 bg-[#EDF5EF] rounded-xl"></div>
          <div className="h-14 bg-[#EDF5EF] rounded-xl"></div>
        </div>
      </div>
    );
  }

  // 1. Incomplete Profile Prompt
  if (!targetsData || !targetsData.profile_complete) {
    const missing = targetsData?.missing_fields || [];
    return (
      <div className="rounded-2xl border border-[#A8D5B5]/60 bg-gradient-to-r from-white to-[#F0F8F3] p-5 shadow-sm hover:shadow-card transition-all">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#DCEFE3] text-[#263D32] shrink-0 mt-0.5 sm:mt-0 border border-[#A8D5B5]/40 shadow-sm">
              <Sparkles className="h-5 w-5 text-[#6BA985]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#263D32]">
                Complete your athletic profile to calculate daily targets
              </h3>
              <p className="text-xs text-[#77847C] mt-1">
                Add your biometric baseline ({missing.length > 0 ? missing.join(', ') : 'height, age, sex, activity level, goal'}) to view your Mifflin-St Jeor BMR, TDEE, and macro ratios.
              </p>
            </div>
          </div>
          <Link
            to="/settings"
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6BA985] hover:bg-[#5A9473] text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <span>Complete Profile</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // 2. Hidden Calorie Numbers (Mindful / Eating Disorder Sensitivity Mode)
  if (user?.hide_calorie_targets || targetsData.hide_calorie_targets) {
    return (
      <div className="rounded-2xl border border-[#E5EDE7] bg-white p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#EDF5EF] text-[#77847C]">
              <EyeOff className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#263D32] uppercase tracking-wider">
                Mindful Tracking Mode Active
              </h3>
              <p className="text-xs text-[#77847C] mt-0.5">
                Calorie numbers are hidden per your settings preference. Focus on your training volume, recovery, and eating quality.
              </p>
            </div>
          </div>
          <Link
            to="/settings"
            className="text-xs font-semibold text-[#6BA985] hover:underline shrink-0"
          >
            Manage Settings
          </Link>
        </div>
      </div>
    );
  }

  // 3. Complete Profile & Targets Display
  const macros = targetsData.macros;
  return (
    <div className="rounded-2xl border border-[#E5EDE7] bg-white p-5 shadow-card hover:shadow-3d transition-all space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E5EDE7]">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-[#DCEFE3] flex items-center justify-center text-[#6BA985]">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <h2 className="text-sm font-bold text-[#263D32] tracking-tight">
            Personal Energy & Macro Targets
          </h2>
          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#DCEFE3] text-[#263D32] border border-[#A8D5B5]/40">
            Mifflin-St Jeor
          </span>
        </div>
        <Link
          to="/settings"
          className="text-xs font-semibold text-[#6BA985] hover:text-[#263D32] transition-colors"
        >
          Edit Biometrics →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-[#E5EDE7] bg-[#F6FAF7] p-3 shadow-inner-mint">
          <span className="text-[10px] font-bold uppercase text-[#77847C] block">BMR</span>
          <span className="text-lg font-black text-[#263D32] mt-0.5 block">{targetsData.bmr}</span>
          <span className="text-[10px] text-[#77847C]">kcal / day</span>
        </div>

        <div className="rounded-xl border border-[#E5EDE7] bg-[#F6FAF7] p-3 shadow-inner-mint">
          <span className="text-[10px] font-bold uppercase text-[#77847C] block">TDEE</span>
          <span className="text-lg font-black text-[#6BA985] mt-0.5 block">{targetsData.tdee}</span>
          <span className="text-[10px] text-[#77847C]">kcal / day</span>
        </div>

        <div className="rounded-xl border border-[#A8D5B5]/60 bg-[#DCEFE3]/50 p-3 shadow-inner-mint">
          <span className="text-[10px] font-bold uppercase text-[#263D32] block">Target Calories</span>
          <span className="text-lg font-black text-[#263D32] mt-0.5 block">{targetsData.calorie_target}</span>
          <span className="text-[10px] text-[#77847C]">
            {targetsData.safe_floor_applied ? 'Floor clamped' : 'kcal / day'}
          </span>
        </div>

        <div className="rounded-xl border border-[#E5EDE7] bg-[#F6FAF7] p-3 shadow-inner-mint">
          <span className="text-[10px] font-bold uppercase text-[#77847C] block">Target Protein</span>
          <span className="text-lg font-black text-[#263D32] mt-0.5 block">{macros?.protein_g}g</span>
          <span className="text-[10px] text-[#77847C]">{macros?.protein_pct}% ({macros?.protein_kcal} kcal)</span>
        </div>

        <div className="rounded-xl border border-[#E5EDE7] bg-[#F6FAF7] p-3 shadow-inner-mint">
          <span className="text-[10px] font-bold uppercase text-[#77847C] block">Target Carbs</span>
          <span className="text-lg font-black text-[#263D32] mt-0.5 block">{macros?.carbs_g}g</span>
          <span className="text-[10px] text-[#77847C]">{macros?.carbs_pct}% ({macros?.carbs_kcal} kcal)</span>
        </div>

        <div className="rounded-xl border border-[#E5EDE7] bg-[#F6FAF7] p-3 shadow-inner-mint">
          <span className="text-[10px] font-bold uppercase text-[#77847C] block">Target Fat</span>
          <span className="text-lg font-black text-[#263D32] mt-0.5 block">{macros?.fat_g}g</span>
          <span className="text-[10px] text-[#77847C]">{macros?.fat_pct}% ({macros?.fat_kcal} kcal)</span>
        </div>
      </div>

      {targetsData.safe_floor_applied && (
        <div className="p-3 rounded-xl border border-[#E8C99B] bg-[#FDF5E6] text-xs text-[#8A5A12]">
          ⚠️ {targetsData.floor_warning}
        </div>
      )}

      <p className="text-[11px] text-[#77847C] italic">
        {targetsData.disclaimer || 'Nutritional estimates are statistical guidelines, not medical advice.'}
      </p>
    </div>
  );
};
