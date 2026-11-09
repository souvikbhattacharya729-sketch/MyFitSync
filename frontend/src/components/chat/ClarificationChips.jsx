import React from 'react';
import { HelpCircle } from 'lucide-react';

export const ClarificationChips = ({ clarifications, onSelectChip }) => {
  if (!clarifications || clarifications.length === 0) return null;

  return (
    <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
      <div className="flex items-center gap-1.5 font-semibold text-amber-300 mb-2">
        <HelpCircle className="h-3.5 w-3.5" />
        <span>Clarification Required</span>
      </div>
      <div className="space-y-2">
        {clarifications.map((item, idx) => (
          <div key={idx} className="flex flex-col gap-1.5">
            <p className="text-amber-200/90">{item.question}</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {item.field === 'sets' && (
                <>
                  {['3 sets', '4 sets', '5 sets'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => onSelectChip && onSelectChip(opt)}
                      className="rounded-lg bg-amber-500/20 px-2.5 py-1 font-medium text-amber-300 hover:bg-amber-500/30 active:scale-95 transition-all"
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
                      className="rounded-lg bg-amber-500/20 px-2.5 py-1 font-medium text-amber-300 hover:bg-amber-500/30 active:scale-95 transition-all"
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
                      className="rounded-lg bg-amber-500/20 px-2.5 py-1 font-medium text-amber-300 hover:bg-amber-500/30 active:scale-95 transition-all"
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
