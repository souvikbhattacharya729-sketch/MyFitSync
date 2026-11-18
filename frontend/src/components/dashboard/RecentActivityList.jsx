import React from 'react';
import { Dumbbell, Utensils, Moon } from 'lucide-react';
import { Card3D } from '../common/Card3D';

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
      <Card3D className="rounded-2xl border border-sage-border bg-white p-5 text-center text-sage-muted text-xs shadow-card">
        No recent activity logged yet.
      </Card3D>
    );
  }

  return (
    <Card3D className="rounded-2xl border border-sage-border bg-white p-5 shadow-card text-sage-forest">
      <h3 className="text-sm font-bold text-sage-forest mb-4">Recent Verified Activity</h3>

      <div className="space-y-3">
        {combined.map((item, idx) => {
          if (item.type === 'workout') {
            return (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl bg-sage-surface/60 p-3 border border-sage-border/60 hover:border-sage-sage/50 hover:bg-white hover:shadow-card transition-all"
                style={{ transform: 'translateZ(10px)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage-mint text-sage-action border border-sage-sage/20">
                    <Dumbbell className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-sage-forest capitalize">{item.exercise.replace('_', ' ')}</h4>
                    <span className="text-[10px] text-sage-muted">{item.date}</span>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-bold text-sage-forest">{item.weight_kg} kg × {item.reps} × {item.sets}</div>
                  <div className="text-[10px] text-sage-muted">{item.total_volume} kg vol {item.rpe ? `(@RPE ${item.rpe})` : ''}</div>
                </div>
              </div>
            );
          }

          if (item.type === 'nutrition') {
            return (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl bg-sage-surface/60 p-3 border border-sage-border/60 hover:border-sage-sage/50 hover:bg-white hover:shadow-card transition-all"
                style={{ transform: 'translateZ(10px)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage-mint text-sage-forest border border-sage-sage/20">
                    <Utensils className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-sage-forest">{item.meal_title || 'Meal'}</h4>
                    <span className="text-[10px] text-sage-muted">{item.date}</span>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-bold text-sage-action">{item.calories ? `${item.calories} kcal` : '-'}</div>
                  <div className="text-[10px] text-sage-muted">
                    {item.protein_g ? `${item.protein_g}g P` : ''} {item.carbs_g ? `• ${item.carbs_g}g C` : ''} {item.fat_g ? `• ${item.fat_g}g F` : ''}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={idx}
              className="flex items-center justify-between rounded-xl bg-sage-surface/60 p-3 border border-sage-border/60 hover:border-sage-sage/50 hover:bg-white hover:shadow-card transition-all"
              style={{ transform: 'translateZ(10px)' }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage-mint text-sage-action border border-sage-sage/20">
                  <Moon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-sage-forest">Daily Readiness</h4>
                  <span className="text-[10px] text-sage-muted">{item.date}</span>
                </div>
              </div>
              <div className="text-right text-xs">
                <div className="font-bold text-sage-forest">{item.sleep_hours ? `${item.sleep_hours} hrs sleep` : '-'}</div>
                <div className="text-[10px] text-sage-muted">
                  {item.soreness_score ? `Soreness: ${item.soreness_score}/10` : ''} {item.resting_hr ? `• ${item.resting_hr} bpm` : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card3D>
  );
};
