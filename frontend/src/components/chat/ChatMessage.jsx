import React from 'react';
import { User, Activity, CheckCircle2, Dumbbell, Utensils, Moon, AlertTriangle, Sparkles } from 'lucide-react';
import { ClarificationChips } from './ClarificationChips';

export const ChatMessage = ({ message, onSelectChip }) => {
  const isUser = message.sender === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="flex max-w-[85%] items-end gap-2.5">
          <div className="rounded-2xl rounded-br-sm bg-sage-surface border border-sage-border px-4 py-2.5 text-sm font-medium text-sage-forest shadow-sm">
            {message.text}
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sage-mint text-sage-action border border-sage-sage/30 font-bold text-xs shadow-sm">
            <User className="h-4 w-4" />
          </div>
        </div>
      </div>
    );
  }

  const saved = message.saved || {};
  const workouts = saved.workouts || [];
  const nutrition = saved.nutrition || [];
  const readiness = saved.readiness || [];
  const clarifications = message.clarifications || [];
  const warnings = message.warnings || [];
  const metrics = message.metrics || {};

  return (
    <div className="flex justify-start mb-4">
      <div className="flex max-w-[90%] items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sage-action text-white font-black shadow-card mt-0.5">
          <Activity className="h-4 w-4" />
        </div>

        <div className="flex flex-col gap-2 rounded-2xl rounded-tl-sm border border-sage-border bg-white p-4 text-sm text-sage-forest shadow-card">
          <p className="leading-relaxed whitespace-pre-wrap">{message.reply || message.text}</p>

          {/* Warnings Banner */}
          {warnings.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
              <div className="space-y-0.5">
                {warnings.map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
              </div>
            </div>
          )}

          {/* Structured Confirmation Cards for Saved Records */}
          {(workouts.length > 0 || nutrition.length > 0 || readiness.length > 0) && (
            <div className="mt-1 space-y-2 rounded-xl bg-sage-surface/60 p-3.5 border border-sage-border/80">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sage-action">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Saved to Verified Database:</span>
              </div>

              {/* Workouts */}
              {workouts.map((w, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-sage-border/60 last:border-0">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-3.5 w-3.5 text-sage-action" />
                    <span className="font-bold capitalize text-sage-forest">{w.exercise.replace('_', ' ')}</span>
                  </div>
                  <div className="text-sage-muted">
                    <span className="text-sage-forest font-semibold">{w.weight_kg} kg</span> × {w.reps} reps × {w.sets} sets
                    {w.rpe ? <span className="ml-1 text-sage-muted font-mono">(@RPE {w.rpe})</span> : null}
                  </div>
                </div>
              ))}

              {/* Nutrition */}
              {nutrition.map((n, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-sage-border/60 last:border-0">
                  <div className="flex items-center gap-2">
                    <Utensils className="h-3.5 w-3.5 text-sage-forest" />
                    <span className="font-bold text-sage-forest">{n.meal_title || 'Meal'}</span>
                  </div>
                  <div className="text-sage-muted">
                    {n.calories ? <span className="text-sage-action font-black">{n.calories} kcal</span> : null}
                    {n.protein_g ? <span className="ml-2 text-sage-forest font-semibold">{n.protein_g}g P</span> : null}
                    {n.carbs_g ? <span className="ml-1.5 text-sage-forest">{n.carbs_g}g C</span> : null}
                    {n.fat_g ? <span className="ml-1.5 text-sage-muted">{n.fat_g}g F</span> : null}
                  </div>
                </div>
              ))}

              {/* Readiness */}
              {readiness.map((r, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2">
                    <Moon className="h-3.5 w-3.5 text-sage-action" />
                    <span className="font-bold text-sage-forest">Recovery Status</span>
                  </div>
                  <div className="text-sage-muted">
                    {r.sleep_hours ? <span className="font-medium text-sage-forest">{r.sleep_hours}h sleep</span> : null}
                    {r.soreness_score ? <span className="ml-2 font-medium">Soreness {r.soreness_score}/10</span> : null}
                    {r.resting_hr ? <span className="ml-2 text-sage-forest font-medium">{r.resting_hr} bpm</span> : null}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sports Science Session Metrics */}
          {metrics.session_volume_kg > 0 && (
            <div className="flex items-center gap-3 text-[11px] font-semibold text-sage-muted pt-1">
              <span>
                Session Volume: <strong className="text-sage-forest">{metrics.session_volume_kg} kg</strong>
              </span>
              {Object.keys(metrics.best_e1rm || {}).length > 0 && (
                <span>
                  Est. 1RM:{' '}
                  {Object.entries(metrics.best_e1rm).map(([ex, val]) => (
                    <strong key={ex} className="text-sage-action ml-1">
                      {ex.replace('_', ' ')}: {val} kg
                    </strong>
                  ))}
                </span>
              )}
            </div>
          )}

          {/* Clarification Protocol Chips */}
          {clarifications.length > 0 && (
            <ClarificationChips clarifications={clarifications} onSelect={onSelectChip} />
          )}
        </div>
      </div>
    </div>
  );
};
