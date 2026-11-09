import React from 'react';
import { User, Activity, CheckCircle2, Dumbbell, Utensils, Moon, AlertTriangle } from 'lucide-react';
import { ClarificationChips } from './ClarificationChips';

export const ChatMessage = ({ message, onSelectChip }) => {
  const isUser = message.sender === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="flex max-w-[85%] items-end gap-2">
          <div className="rounded-2xl rounded-br-sm bg-gradient-to-r from-emerald-500 to-cyan-600 px-4 py-2.5 text-sm font-medium text-slate-950 shadow-md shadow-emerald-500/10">
            {message.text}
          </div>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs">
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
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 shadow-md shadow-emerald-500/20 mt-0.5">
          <Activity className="h-4 w-4" />
        </div>

        <div className="flex flex-col gap-2 rounded-2xl rounded-tl-sm border border-slate-800 bg-[#131B2A] p-4 text-sm text-slate-100 shadow-sm">
          <p className="leading-relaxed whitespace-pre-wrap">{message.reply || message.text}</p>

          {/* Warnings Banner */}
          {warnings.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
              <div className="space-y-0.5">
                {warnings.map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
              </div>
            </div>
          )}

          {/* Structured Confirmation Cards for Saved Records */}
          {(workouts.length > 0 || nutrition.length > 0 || readiness.length > 0) && (
            <div className="mt-1 space-y-2 rounded-xl bg-[#0B0F17]/60 p-3 border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Saved to Database:</span>
              </div>

              {/* Workouts */}
              {workouts.map((w, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/40 last:border-0">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="font-semibold capitalize text-slate-200">{w.exercise.replace('_', ' ')}</span>
                  </div>
                  <div className="text-slate-400">
                    <span className="text-white font-medium">{w.weight_kg} kg</span> × {w.reps} reps × {w.sets} sets
                    {w.rpe ? <span className="ml-1 text-slate-400 font-mono">(@RPE {w.rpe})</span> : null}
                  </div>
                </div>
              ))}

              {/* Nutrition */}
              {nutrition.map((n, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/40 last:border-0">
                  <div className="flex items-center gap-2">
                    <Utensils className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="font-semibold text-slate-200">{n.meal_title || 'Meal'}</span>
                  </div>
                  <div className="text-slate-400">
                    {n.calories ? <span className="text-emerald-400 font-medium">{n.calories} kcal</span> : null}
                    {n.protein_g ? <span className="ml-2">{n.protein_g}g P</span> : null}
                    {n.carbs_g ? <span className="ml-1.5">{n.carbs_g}g C</span> : null}
                    {n.fat_g ? <span className="ml-1.5">{n.fat_g}g F</span> : null}
                  </div>
                </div>
              ))}

              {/* Readiness */}
              {readiness.map((r, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2">
                    <Moon className="h-3.5 w-3.5 text-violet-400" />
                    <span className="font-semibold text-slate-200">Recovery</span>
                  </div>
                  <div className="text-slate-400">
                    {r.sleep_hours ? <span>{r.sleep_hours}h sleep</span> : null}
                    {r.soreness_score ? <span className="ml-2">Soreness {r.soreness_score}/10</span> : null}
                    {r.resting_hr ? <span className="ml-2 font-mono">RHR {r.resting_hr} bpm</span> : null}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Metrics summary */}
          {metrics.session_volume_kg > 0 && (
            <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-0.5">
              <span>Session Volume: <strong className="text-white">{metrics.session_volume_kg} kg</strong></span>
              {metrics.best_e1rm && Object.keys(metrics.best_e1rm).length > 0 && (
                <span>• Best E1RM: <strong className="text-cyan-400">{JSON.stringify(metrics.best_e1rm)}</strong></span>
              )}
            </div>
          )}

          {/* Quick Reply Clarification Chips */}
          <ClarificationChips clarifications={clarifications} onSelectChip={onSelectChip} />
        </div>
      </div>
    </div>
  );
};
