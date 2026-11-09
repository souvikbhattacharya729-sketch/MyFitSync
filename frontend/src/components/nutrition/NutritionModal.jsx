import React, { useState, useEffect } from 'react';
import { X, Utensils } from 'lucide-react';

export const NutritionModal = ({ isOpen, onClose, onSave, entry = null }) => {
  const [mealTitle, setMealTitle] = useState('');
  const [calories, setCalories] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [carbsG, setCarbsG] = useState('');
  const [fatG, setFatG] = useState('');
  const [eatenOn, setEatenOn] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (entry) {
      setMealTitle(entry.meal_title || '');
      setCalories(entry.calories ?? '');
      setProteinG(entry.protein_g ?? '');
      setCarbsG(entry.carbs_g ?? '');
      setFatG(entry.fat_g ?? '');
      setEatenOn(entry.eaten_on);
    } else {
      setMealTitle('');
      setCalories('');
      setProteinG('');
      setCarbsG('');
      setFatG('');
      setEatenOn(new Date().toISOString().split('T')[0]);
    }
    setError(null);
  }, [entry, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!mealTitle.trim() && !calories && !proteinG && !carbsG && !fatG) {
      setError('Please provide at least a meal title or calories/macros.');
      return;
    }

    onSave({
      meal_title: mealTitle.trim() || 'Meal',
      calories: calories !== '' ? parseFloat(calories) : null,
      protein_g: proteinG !== '' ? parseFloat(proteinG) : null,
      carbs_g: carbsG !== '' ? parseFloat(carbsG) : null,
      fat_g: fatG !== '' ? parseFloat(fatG) : null,
      eaten_on: eatenOn,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#131B2A] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Utensils className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-white">
              {entry ? 'Edit Nutrition Entry' : 'Log Nutrition Entry'}
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
            <label className="block text-xs font-semibold text-slate-400 mb-1">Meal Description</label>
            <input
              type="text"
              value={mealTitle}
              onChange={(e) => setMealTitle(e.target.value)}
              placeholder="e.g. Grilled Chicken Salad & Quinoa"
              className="w-full rounded-xl border border-slate-800 bg-[#0B0F17] px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Calories (kcal)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="e.g. 650"
                className="w-full rounded-xl border border-slate-800 bg-[#0B0F17] px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Date</label>
              <input
                type="date"
                value={eatenOn}
                onChange={(e) => setEatenOn(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-[#0B0F17] px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Protein (g)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={proteinG}
                onChange={(e) => setProteinG(e.target.value)}
                placeholder="40"
                className="w-full rounded-xl border border-slate-800 bg-[#0B0F17] px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Carbs (g)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={carbsG}
                onChange={(e) => setCarbsG(e.target.value)}
                placeholder="60"
                className="w-full rounded-xl border border-slate-800 bg-[#0B0F17] px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Fat (g)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={fatG}
                onChange={(e) => setFatG(e.target.value)}
                placeholder="15"
                className="w-full rounded-xl border border-slate-800 bg-[#0B0F17] px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
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
              {entry ? 'Save Changes' : 'Log Nutrition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
