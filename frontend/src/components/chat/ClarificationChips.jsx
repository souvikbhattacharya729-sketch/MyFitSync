import React from 'react';
import { HelpCircle } from 'lucide-react';

export const ClarificationChips = ({ clarifications, onSelectChip }) => {
  if (!clarifications || clarifications.length === 0) return null;

  return (
    <div className="mt-3 rounded-xl border border-sage-sage/40 bg-sage-mint/40 p-3 text-xs text-sage-forest">
      <div className="flex items-center gap-1.5 font-bold text-sage-action mb-2">
        <HelpCircle className="h-4 w-4" />
        <span>Clarification Required</span>
      </div>
      <div className="space-y-2">
        {clarifications.map((item, idx) => (
          <div key={idx} className="flex flex-col gap-1.5">
            <p className="text-sage-forest font-medium">{item.question}</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {item.field === 'sets' && (
                <>
                  {['3 sets', '4 sets', '5 sets'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => onSelectChip && onSelectChip(opt)}
                      className="rounded-lg bg-white border border-sage-border px-2.5 py-1 font-semibold text-sage-forest hover:bg-sage-mint hover:text-sage-action hover:border-sage-action/40 active:scale-95 transition-all shadow-sm"
                    >
                      {opt}
                    </button>
                  ))}
                </>
              )}
              {item.field === 'sets_or_reps' && (
                <>
                  {['5 reps, 3 sets', '5 sets of 5', '10 reps, 3 sets'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => onSelectChip && onSelectChip(opt)}
                      className="rounded-lg bg-white border border-sage-border px-2.5 py-1 font-semibold text-sage-forest hover:bg-sage-mint hover:text-sage-action hover:border-sage-action/40 active:scale-95 transition-all shadow-sm"
                    >
                      {opt}
                    </button>
                  ))}
                </>
              )}
              {item.field === 'nutrition_macros' && (
                <>
                  {['300 calories, 40g protein', 'No macros, just track food'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => onSelectChip && onSelectChip(opt)}
                      className="rounded-lg bg-white border border-sage-border px-2.5 py-1 font-semibold text-sage-forest hover:bg-sage-mint hover:text-sage-action hover:border-sage-action/40 active:scale-95 transition-all shadow-sm"
                    >
                      {opt}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
