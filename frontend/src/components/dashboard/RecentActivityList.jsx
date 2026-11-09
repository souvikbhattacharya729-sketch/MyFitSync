import React from 'react';
import { Dumbbell, Utensils, Moon, Calendar } from 'lucide-react';

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
      <div className="rounded-2xl border border-slate-800 bg-[#131B2A] p-5 text-center text-slate-400 text-xs">
        No recent activity logged yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#131B2A] p-5 shadow-sm">
      <h3 className="text-sm font-bold text-white mb-4">Recent Verified Activity</h3>

      <div className="space-y-3">
        {combined.map((item, idx) => {
          if (item.type === 'workout') {
            return (
              <div key={idx} className="flex items-center justify-between rounded-xl bg-[#0B0F17]/60 p-3 border border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                    <Dumbbell className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white capitalize">{item.exercise.replace('_', ' ')}</h4>
                    <span className="text-[10px] text-slate-400">{item.date}</span>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-bold text-white">{item.weight_kg} kg × {item.reps} × {item.sets}</div>
                  <div className="text-[10px] text-slate-400">{item.total_volume} kg vol {item.rpe ? `(@RPE ${item.rpe})` : ''}</div>
                </div>
              </div>
            );
          }

          if (item.type === 'nutrition') {
            return (
              <div key={idx} className="flex items-center justify-between rounded-xl bg-[#0B0F17]/60 p-3 border border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Utensils className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">{item.meal_title || 'Meal'}</h4>
                    <span className="text-[10px] text-slate-400">{item.date}</span>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-bold text-emerald-400">{item.calories ? `${item.calories} kcal` : 'Logged'}</div>
                  <div className="text-[10px] text-slate-400">
                    {[item.protein_g && `${item.protein_g}g P`, item.carbs_g && `${item.carbs_g}g C`, item.fat_g && `${item.fat_g}g F`].filter(Boolean).join(' • ')}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={idx} className="flex items-center justify-between rounded-xl bg-[#0B0F17]/60 p-3 border border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                  <Moon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Daily Recovery</h4>
                  <span className="text-[10px] text-slate-400">{item.date}</span>
                </div>
              </div>
              <div className="text-right text-xs text-slate-300">
                <div className="font-bold text-white">{item.sleep_hours ? `${item.sleep_hours}h sleep` : 'Logged'}</div>
                <div className="text-[10px] text-slate-400">
                  {item.soreness_score ? `Soreness: ${item.soreness_score}/10` : ''} {item.resting_hr ? `• RHR: ${item.resting_hr} bpm` : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
