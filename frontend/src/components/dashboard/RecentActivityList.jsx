import React from 'react';
import { Dumbbell, Utensils, Moon } from 'lucide-react';

export const RecentActivityList = ({ recentActivity }) => {
  const workouts = recentActivity?.workouts || [];
  const nutrition = recentActivity?.nutrition || [];
  const readiness = recentActivity?.readiness || [];

  const combined = [
    ...workouts.map((w) => ({ ...w, type: 'workout', date: w.performed_on })),
    ...nutrition.map((n) => ({ ...n, type: 'nutrition', date: n.eaten_on })),
    ...readiness.map((r) => ({ ...r, type: 'readiness', date: r.logged_date })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7);

  if (combined.length === 0) {
    return (
      <div className="rounded-2xl border border-[#20252E] bg-[#161A21] p-5 text-center text-[#9AA3B2] text-xs">
        No recent activity logged yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#20252E] bg-[#161A21] p-5 shadow-sm text-[#F5F7FA]">
      <h3 className="text-sm font-bold text-[#F5F7FA] mb-4">Recent Verified Activity</h3>

      <div className="space-y-3">
        {combined.map((item, idx) => {
          if (item.type === 'workout') {
            return (
              <div key={idx} className="flex items-center justify-between rounded-xl bg-[#20252E] p-3 border border-[#20252E]">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4DA3FF]/10 text-[#4DA3FF]">
                    <Dumbbell className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#F5F7FA] capitalize">{item.exercise.replace('_', ' ')}</h4>
                    <span className="text-[10px] text-[#9AA3B2]">{item.date}</span>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-bold text-[#F5F7FA]">{item.weight_kg} kg × {item.reps} × {item.sets}</div>
                  <div className="text-[10px] text-[#9AA3B2]">{item.total_volume} kg vol {item.rpe ? `(@RPE ${item.rpe})` : ''}</div>
                </div>
              </div>
            );
          }

          if (item.type === 'nutrition') {
            return (
              <div key={idx} className="flex items-center justify-between rounded-xl bg-[#20252E] p-3 border border-[#20252E]">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C6FF3D]/10 text-[#C6FF3D]">
                    <Utensils className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#F5F7FA]">{item.meal_title || 'Meal'}</h4>
                    <span className="text-[10px] text-[#9AA3B2]">{item.date}</span>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-black text-[#C6FF3D]">{item.calories ? `${item.calories} kcal` : '-'}</div>
                  <div className="text-[10px] text-[#9AA3B2]">
                    {item.protein_g ? `${item.protein_g}g P` : ''} {item.carbs_g ? `• ${item.carbs_g}g C` : ''} {item.fat_g ? `• ${item.fat_g}g F` : ''}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={idx} className="flex items-center justify-between rounded-xl bg-[#20252E] p-3 border border-[#20252E]">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6]">
                  <Moon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#F5F7FA]">Daily Readiness</h4>
                  <span className="text-[10px] text-[#9AA3B2]">{item.date}</span>
                </div>
              </div>
              <div className="text-right text-xs">
                <div className="font-bold text-[#F5F7FA]">{item.sleep_hours ? `${item.sleep_hours} hrs sleep` : '-'}</div>
                <div className="text-[10px] text-[#9AA3B2]">
                  {item.soreness_score ? `Soreness: ${item.soreness_score}/10` : ''} {item.resting_hr ? `• ${item.resting_hr} bpm` : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
