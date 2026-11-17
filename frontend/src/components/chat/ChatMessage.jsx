import React from 'react';
import { User, Activity, CheckCircle2, Dumbbell, Utensils, Moon, AlertTriangle, Sparkles } from 'lucide-react';
import { ClarificationChips } from './ClarificationChips';

export const ChatMessage = ({ message, onSelectChip }) => {
  const isUser = message.sender === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="flex max-w-[85%] items-end gap-2">
          <div className="rounded-2xl rounded-br-sm bg-[#20252E] border border-slate-750 px-4 py-2.5 text-sm font-medium text-[#F5F7FA] shadow-md">
            {message.text}
          </div>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#C6FF3D]/10 text-[#C6FF3D] border border-[#C6FF3D]/20 font-bold text-xs">
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
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#C6FF3D] text-[#0B0D10] font-black shadow-md shadow-[#C6FF3D]/10 mt-0.5">
          <Activity className="h-4 w-4" />
        </div>

        <div className="flex flex-col gap-2 rounded-2xl rounded-tl-sm border border-[#20252E] bg-[#161A21] p-4 text-sm text-[#F5F7FA] shadow-sm">
          <p className="leading-relaxed whitespace-pre-wrap">{message.reply || message.text}</p>

          {/* Warnings Banner */}
          {warnings.length > 0 && (
            <div className="rounded-xl border border-[#FFB020]/30 bg-[#FFB020]/10 p-2.5 text-xs text-[#FFB020] flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                {warnings.map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
              </div>
            </div>
          )}

          {/* Structured Confirmation Cards for Saved Records */}
          {(workouts.length > 0 || nutrition.length > 0 || readiness.length > 0) && (
            <div className="mt-1 space-y-2 rounded-xl bg-[#0B0D10]/80 p-3 border border-[#20252E]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#C6FF3D]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Saved to Verified Database:</span>
              </div>

              {/* Workouts */}
              {workouts.map((w, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-[#20252E] last:border-0">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-3.5 w-3.5 text-[#4DA3FF]" />
                    <span className="font-semibold capitalize text-[#F5F7FA]">{w.exercise.replace('_', ' ')}</span>
                  </div>
                  <div className="text-[#9AA3B2]">
                    <span className="text-[#F5F7FA] font-medium">{w.weight_kg} kg</span> × {w.reps} reps × {w.sets} sets
                    {w.rpe ? <span className="ml-1 text-[#9AA3B2] font-mono">(@RPE {w.rpe})</span> : null}
                  </div>
                </div>
              ))}

              {/* Nutrition */}
              {nutrition.map((n, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-[#20252E] last:border-0">
                  <div className="flex items-center gap-2">
                    <Utensils className="h-3.5 w-3.5 text-[#C6FF3D]" />
                    <span className="font-semibold text-[#F5F7FA]">{n.meal_title || 'Meal'}</span>
                  </div>
                  <div className="text-[#9AA3B2]">
                    {n.calories ? <span className="text-[#C6FF3D] font-bold">{n.calories} kcal</span> : null}
                    {n.protein_g ? <span className="ml-2 text-[#F5F7FA]">{n.protein_g}g P</span> : null}
                    {n.carbs_g ? <span className="ml-1.5 text-[#4DA3FF]">{n.carbs_g}g C</span> : null}
                    {n.fat_g ? <span className="ml-1.5 text-[#FFB020]">{n.fat_g}g F</span> : null}
                  </div>
                </div>
              ))}

              {/* Readiness */}
              {readiness.map((r, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2">
                    <Moon className="h-3.5 w-3.5 text-[#8B5CF6]" />
                    <span className="font-semibold text-[#F5F7FA]">Recovery Status</span>
                  </div>
                  <div className="text-[#9AA3B2]">
                    {r.sleep_hours ? <span>{r.sleep_hours}h sleep</span> : null}
                    {r.soreness_score ? <span className="ml-2 text-[#FFB020]">Soreness {r.soreness_score}/10</span> : null}
                    {r.resting_hr ? <span className="ml-2 text-[#F5F7FA]">{r.resting_hr} bpm</span> : null}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sports Science Session Metrics */}
          {metrics.session_volume_kg > 0 && (
            <div className="flex items-center gap-3 text-[11px] font-semibold text-[#9AA3B2] pt-1">
              <span>
                Session Volume: <strong className="text-[#4DA3FF]">{metrics.session_volume_kg} kg</strong>
              </span>
              {Object.keys(metrics.best_e1rm || {}).length > 0 && (
                <span>
                  Est. 1RM:{' '}
                  {Object.entries(metrics.best_e1rm).map(([ex, val]) => (
                    <strong key={ex} className="text-[#C6FF3D] ml-1">
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
