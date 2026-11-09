import React, { useState, useEffect } from 'react';
import { X, Dumbbell } from 'lucide-react';

const COMMON_EXERCISES = [
  'squat',
  'bench_press',
  'deadlift',
  'overhead_press',
  'barbell_row',
  'pull_up',
  'incline_bench_press',
  'romanian_deadlift',
  'front_squat',
  'dip',
];

export const WorkoutModal = ({ isOpen, onClose, onSave, workout = null }) => {
  const [exercise, setExercise] = useState('bench_press');
  const [customExercise, setCustomExercise] = useState('');
  const [weightKg, setWeightKg] = useState(100);
  const [reps, setReps] = useState(5);
  const [sets, setSets] = useState(3);
  const [rpe, setRpe] = useState('');
  const [performedOn, setPerformedOn] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (workout) {
      if (COMMON_EXERCISES.includes(workout.exercise)) {
        setExercise(workout.exercise);
        setCustomExercise('');
      } else {
        setExercise('custom');
        setCustomExercise(workout.exercise);
      }
      setWeightKg(workout.weight_kg);
      setReps(workout.reps);
      setSets(workout.sets);
      setRpe(workout.rpe ?? '');
      setPerformedOn(workout.performed_on);
    } else {
      setExercise('bench_press');
      setCustomExercise('');
      setWeightKg(100);
      setReps(5);
      setSets(3);
      setRpe('');
      setPerformedOn(new Date().toISOString().split('T')[0]);
    }
    setError(null);
  }, [workout, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalExercise = exercise === 'custom' ? customExercise.trim().toLowerCase() : exercise;
    if (!finalExercise) {
      setError('Exercise name is required.');
      return;
    }
    if (weightKg < 0) {
      setError('Weight must be non-negative.');
      return;
    }
    if (reps <= 0 || sets <= 0) {
      setError('Reps and sets must be strictly greater than 0.');
      return;
    }

    onSave({
      exercise: finalExercise,
      exercise_raw: finalExercise.replace('_', ' '),
      weight_kg: parseFloat(weightKg),
      reps: parseInt(reps, 10),
      sets: parseInt(sets, 10),
      rpe: rpe ? parseFloat(rpe) : null,
      performed_on: performedOn,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#131B2A] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <Dumbbell className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-white">
              {workout ? 'Edit Workout Entry' : 'Log Workout Entry'}
            </h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Exercise</label>
            <select
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-[#0B0F17] px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            >
              {COMMON_EXERCISES.map((ex) => (
                <option key={ex} value={ex}>
                  {ex.replace('_', ' ').toUpperCase()}
                </option>
              ))}
              <option value="custom">Other / Custom Exercise</option>
            </select>
          </div>

          {exercise === 'custom' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Custom Exercise Name</label>
              <input
                type="text"
                value={customExercise}
                onChange={(e) => setCustomExercise(e.target.value)}
                placeholder="e.g. Bulgarian Split Squat"
                className="w-full rounded-xl border border-slate-800 bg-[#0B0F17] px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-[#0B0F17] px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Reps</label>
              <input
                type="number"
                min="1"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-[#0B0F17] px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Sets</label>
              <input
                type="number"
                min="1"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-[#0B0F17] px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">RPE (1 - 10, opt)</label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="10"
                value={rpe}
                onChange={(e) => setRpe(e.target.value)}
                placeholder="e.g. 8.5"
                className="w-full rounded-xl border border-slate-800 bg-[#0B0F17] px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Date</label>
              <input
                type="date"
                value={performedOn}
                onChange={(e) => setPerformedOn(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-[#0B0F17] px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2 text-xs font-semibold text-slate-950 shadow-md hover:opacity-90 active:scale-95 transition-all"
            >
              {workout ? 'Save Changes' : 'Record Workout'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
