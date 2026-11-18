import React from 'react';
import { Inbox, Plus } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = "No data recorded yet",
  description = "Start logging your workouts, nutrition or recovery to unlock metrics.",
  actionText = "Log First Entry",
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-sage-sage/50 bg-white/70 p-8 text-center my-4 shadow-card">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-mint text-sage-action mb-4 border border-sage-sage/30 shadow-sm">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-base font-bold text-sage-forest mb-1">{title}</h3>
      <p className="text-sm text-sage-muted max-w-sm mb-6">{description}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 rounded-xl bg-sage-action px-5 py-2.5 text-sm font-bold text-white shadow-card hover:bg-sage-forest active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          {actionText}
        </button>
      )}
    </div>
  );
};
