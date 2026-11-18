import React, { useState, useEffect } from 'react';
import { X, Moon } from 'lucide-react';

export const ReadinessModal = ({ isOpen, onClose, onSave, entry = null }) => {
  const [sleepHours, setSleepHours] = useState('');
  const [sorenessScore, setSorenessScore] = useState('');
  const [restingHr, setRestingHr] = useState('');
  const [loggedDate, setLoggedDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (entry) {
      setSleepHours(entry.sleep_hours ?? '');
      setSorenessScore(entry.soreness_score ?? '');
      setRestingHr(entry.resting_hr ?? '');
      setLoggedDate(entry.logged_date);
    } else {
      setSleepHours(7.5);
      setSorenessScore(3);
      setRestingHr(55);
      setLoggedDate(new Date().toISOString().split('T')[0]);
    }
    setError(null);
  }, [entry, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (sleepHours !== '' && (parseFloat(sleepHours) < 0 || parseFloat(sleepHours) > 24)) {
      setError('Sleep duration must be between 0 and 24 hours.');
      return;
    }
    if (sorenessScore !== '' && (parseFloat(sorenessScore) < 1 || parseFloat(sorenessScore) > 10)) {
      setError('Soreness score must be between 1 and 10.');
      return;
    }
    if (restingHr !== '' && (parseInt(restingHr, 10) <= 0 || parseInt(restingHr, 10) >= 250)) {
      setError('Resting heart rate must be between 1 and 249 bpm.');
      return;
    }

    onSave({
      sleep_hours: sleepHours !== '' ? parseFloat(sleepHours) : null,
      soreness_score: sorenessScore !== '' ? parseFloat(sorenessScore) : null,
      resting_hr: restingHr !== '' ? parseInt(restingHr, 10) : null,
      logged_date: loggedDate,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sage-forest/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-sage-border bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-sage-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-mint text-sage-action border border-sage-sage/30 shadow-sm">
              <Moon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-sage-forest">Log Recovery & Readiness</h3>
              <p className="text-[11px] text-sage-muted">Track sleep, soreness, and resting heart rate</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-sage-muted hover:text-sage-forest hover:bg-sage-surface transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-sage-forest mb-1.5">Date</label>
            <input
              type="date"
              value={loggedDate}
              onChange={(e) => setLoggedDate(e.target.value)}
              className="w-full rounded-xl border border-sage-border bg-white px-3.5 py-2.5 text-sm text-sage-forest focus:border-sage-action focus:outline-none focus:ring-1 focus:ring-sage-action shadow-sm font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-sage-forest mb-1.5">Sleep Duration (Hours)</label>
            <input
              type="number"
              step="0.25"
              min="0"
              max="24"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              placeholder="e.g. 7.5"
              className="w-full rounded-xl border border-sage-border bg-white px-3.5 py-2.5 text-sm text-sage-forest focus:border-sage-action focus:outline-none focus:ring-1 focus:ring-sage-action shadow-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-sage-forest mb-1.5">Soreness Rating (1 = Fresh, 10 = Severe)</label>
            <input
              type="number"
              step="0.5"
              min="1"
              max="10"
              value={sorenessScore}
              onChange={(e) => setSorenessScore(e.target.value)}
              placeholder="e.g. 3"
              className="w-full rounded-xl border border-sage-border bg-white px-3.5 py-2.5 text-sm text-sage-forest focus:border-sage-action focus:outline-none focus:ring-1 focus:ring-sage-action shadow-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-sage-forest mb-1.5">Resting Heart Rate (BPM)</label>
            <input
              type="number"
              min="1"
              max="249"
              value={restingHr}
              onChange={(e) => setRestingHr(e.target.value)}
              placeholder="e.g. 52"
              className="w-full rounded-xl border border-sage-border bg-white px-3.5 py-2.5 text-sm text-sage-forest focus:border-sage-action focus:outline-none focus:ring-1 focus:ring-sage-action shadow-sm font-semibold"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-sage-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-sage-muted hover:text-sage-forest hover:bg-sage-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-sage-action hover:bg-sage-forest px-5 py-2.5 text-xs font-bold text-white shadow-card active:scale-95 transition-all"
            >
              Save Recovery
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
