import React, { useState, useEffect, useRef } from 'react';
import { X, Utensils, Sparkles, Check } from 'lucide-react';
import { estimateFoodMacros, searchFoodSuggestions, POPULAR_FOODS } from '../../data/foodDatabase';

const UNIT_OPTIONS = ['pcs', 'grms', 'oz', 'cups', 'scoops', 'tbsp', 'ml'];

export const NutritionModal = ({ isOpen, onClose, onSave, entry = null }) => {
  const [mealTitle, setMealTitle] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [calories, setCalories] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [carbsG, setCarbsG] = useState('');
  const [fatG, setFatG] = useState('');
  const [eatenOn, setEatenOn] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState(null);

  // Suggestions and AI indicator
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [autoFilledInfo, setAutoFilledInfo] = useState(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    if (entry) {
      setMealTitle(entry.meal_title || '');
      setCalories(entry.calories ?? '');
      setProteinG(entry.protein_g ?? '');
      setCarbsG(entry.carbs_g ?? '');
      setFatG(entry.fat_g ?? '');
      setEatenOn(entry.eaten_on);
      setQuantity('1');
      setUnit('pcs');
      setAutoFilledInfo(null);
    } else {
      setMealTitle('');
      setCalories('');
      setProteinG('');
      setCarbsG('');
      setFatG('');
      setQuantity('1');
      setUnit('pcs');
      setEatenOn(new Date().toISOString().split('T')[0]);
      setAutoFilledInfo(null);
    }
    setError(null);
  }, [entry, isOpen]);

  // Click outside suggestions listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recalculate macros automatically whenever mealTitle, quantity, or unit changes
  const tryAutoCalculate = (title, qty, chosenUnit) => {
    if (!title || title.trim().length < 2) {
      setAutoFilledInfo(null);
      return;
    }

    const estimated = estimateFoodMacros(title, qty, chosenUnit);
    if (estimated) {
      setCalories(String(estimated.calories));
      setProteinG(String(estimated.protein_g));
      setCarbsG(String(estimated.carbs_g));
      setFatG(String(estimated.fat_g));
      setAutoFilledInfo({
        foodName: estimated.foodName,
        quantity: estimated.quantity,
        unit: estimated.activeUnit,
      });
      if (!chosenUnit && estimated.defaultUnit) {
        setUnit(estimated.defaultUnit);
      }
    } else {
      setAutoFilledInfo(null);
    }
  };

  const handleTitleChange = (val) => {
    setMealTitle(val);
    if (val.trim().length >= 2) {
      const matches = searchFoodSuggestions(val);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    tryAutoCalculate(val, quantity, unit);
  };

  const handleSelectSuggestion = (food) => {
    setMealTitle(food.name);
    setShowSuggestions(false);
    const targetUnit = food.defaultUnit || unit;
    const defaultQty = targetUnit === 'grms' ? '100' : '1';
    setQuantity(defaultQty);
    setUnit(targetUnit);
    tryAutoCalculate(food.name, defaultQty, targetUnit);
  };

  const handleQuantityChange = (newQty) => {
    setQuantity(newQty);
    tryAutoCalculate(mealTitle, newQty, unit);
  };

  const handleUnitChange = (newUnit) => {
    setUnit(newUnit);
    tryAutoCalculate(mealTitle, quantity, newUnit);
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!mealTitle.trim() && !calories && !proteinG && !carbsG && !fatG) {
      setError('Please provide at least a meal title or calories/macros.');
      return;
    }

    const titleWithQty = autoFilledInfo
      ? `${mealTitle.trim()} (${quantity} ${unit})`
      : mealTitle.trim() || 'Meal';

    onSave({
      meal_title: titleWithQty,
      calories: calories !== '' ? parseFloat(calories) : null,
      protein_g: proteinG !== '' ? parseFloat(proteinG) : null,
      carbs_g: carbsG !== '' ? parseFloat(carbsG) : null,
      fat_g: fatG !== '' ? parseFloat(fatG) : null,
      eaten_on: eatenOn,
    });
  };

  // Macro ratio calculation for visual preview
  const numP = parseFloat(proteinG) || 0;
  const numC = parseFloat(carbsG) || 0;
  const numF = parseFloat(fatG) || 0;
  const totalMacroGrams = numP + numC + numF;
  const pctP = totalMacroGrams > 0 ? Math.round((numP / totalMacroGrams) * 100) : 0;
  const pctC = totalMacroGrams > 0 ? Math.round((numC / totalMacroGrams) * 100) : 0;
  const pctF = totalMacroGrams > 0 ? Math.round((numF / totalMacroGrams) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sage-forest/40 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-2xl border border-sage-border bg-white p-6 shadow-2xl text-sage-forest animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-sage-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-mint text-sage-action border border-sage-sage/30 shadow-sm">
              <Utensils className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-sage-forest">
                {entry ? 'Edit Nutrition Entry' : 'Smart Nutrition & Macro Logger'}
              </h3>
              <p className="text-[11px] text-sage-muted">
                Auto-calculates calories & macros from quantity and metrics
              </p>
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
          {/* Meal Description with Autocomplete */}
          <div className="relative" ref={suggestionsRef}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-sage-forest">Meal Description</label>
              {autoFilledInfo && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-sage-action">
                  <Sparkles className="h-3 w-3" /> Auto-calculated
                </span>
              )}
            </div>
            <input
              type="text"
              value={mealTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              onFocus={() => mealTitle.trim().length >= 2 && setShowSuggestions(suggestions.length > 0)}
              placeholder="e.g. Boiled egg, Chicken breast, White rice"
              className="w-full rounded-xl border border-sage-border bg-white px-3.5 py-2.5 text-sm text-sage-forest focus:border-sage-action focus:outline-none focus:ring-1 focus:ring-sage-action placeholder-sage-muted/60 shadow-sm transition-colors"
              autoFocus
            />

            {/* Quick Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-xl border border-sage-border bg-white shadow-float overflow-hidden py-1">
                {suggestions.map((food) => (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(food)}
                    className="flex items-center justify-between w-full px-3.5 py-2 text-xs text-left text-sage-forest hover:bg-sage-surface transition-colors"
                  >
                    <span className="font-semibold">{food.name}</span>
                    <span className="text-[10px] text-sage-muted uppercase tracking-wider bg-sage-surface px-2 py-0.5 rounded-md border border-sage-border/60">
                      {food.category}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {['Boiled egg', 'Chicken breast', 'White rice', 'Whey protein', 'Oats', 'Banana'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setMealTitle(preset);
                  const matched = POPULAR_FOODS.find((f) => f.aliases.includes(preset.toLowerCase()));
                  const targetUnit = matched?.defaultUnit || 'pcs';
                  const defaultQty = targetUnit === 'grms' ? '100' : '1';
                  setQuantity(defaultQty);
                  setUnit(targetUnit);
                  tryAutoCalculate(preset, defaultQty, targetUnit);
                }}
                className="text-[11px] font-semibold text-sage-forest bg-sage-surface hover:bg-sage-mint hover:text-sage-action border border-sage-border px-2.5 py-1 rounded-lg transition-all shadow-sm"
              >
                + {preset}
              </button>
            ))}
          </div>

          {/* Quantity and Serving Unit Selector */}
          <div className="rounded-xl border border-sage-border bg-sage-surface/60 p-3">
            <span className="text-[10px] font-bold text-sage-forest uppercase tracking-wider block mb-2">
              Serving Metric & Quantity
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-sage-muted mb-1">Quantity</label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  placeholder="e.g. 2"
                  className="w-full rounded-xl border border-sage-border bg-white px-3 py-2 text-sm text-sage-forest font-semibold focus:border-sage-action focus:outline-none shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-sage-muted mb-1">Metric Unit</label>
                <select
                  value={unit}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="w-full rounded-xl border border-sage-border bg-white px-3 py-2 text-sm text-sage-forest font-semibold focus:border-sage-action focus:outline-none cursor-pointer shadow-sm"
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u === 'pcs' ? 'pcs (pieces)' : u === 'grms' ? 'grms (grams)' : u}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Calories and Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-sage-forest mb-1">Calories (kcal)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="e.g. 156"
                className="w-full rounded-xl border border-sage-border bg-white px-3 py-2 text-sm font-bold text-sage-forest focus:border-sage-action focus:outline-none shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-sage-forest mb-1">Date</label>
              <input
                type="date"
                value={eatenOn}
                onChange={(e) => setEatenOn(e.target.value)}
                className="w-full rounded-xl border border-sage-border bg-white px-3 py-2 text-sm text-sage-forest focus:border-sage-action focus:outline-none shadow-sm"
                required
              />
            </div>
          </div>

          {/* Macro Trio Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-sage-sage/40 bg-sage-mint/40 p-2.5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-sage-action">Protein</span>
                <span className="text-[10px] text-sage-muted">4 kcal/g</span>
              </div>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={proteinG}
                  onChange={(e) => setProteinG(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent text-sm font-black text-sage-forest focus:outline-none"
                />
                <span className="text-xs text-sage-muted font-bold">g</span>
              </div>
            </div>

            <div className="rounded-xl border border-sage-border bg-sage-surface p-2.5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-sage-forest">Carbs</span>
                <span className="text-[10px] text-sage-muted">4 kcal/g</span>
              </div>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={carbsG}
                  onChange={(e) => setCarbsG(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent text-sm font-black text-sage-forest focus:outline-none"
                />
                <span className="text-xs text-sage-muted font-bold">g</span>
              </div>
            </div>

            <div className="rounded-xl border border-sage-border bg-sage-surface p-2.5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-sage-muted">Fat</span>
                <span className="text-[10px] text-sage-muted">9 kcal/g</span>
              </div>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={fatG}
                  onChange={(e) => setFatG(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent text-sm font-black text-sage-forest focus:outline-none"
                />
                <span className="text-xs text-sage-muted font-bold">g</span>
              </div>
            </div>
          </div>

          {/* Macro Ratio Visual Bar */}
          {totalMacroGrams > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-semibold text-sage-muted">
                <span>Macro Ratio:</span>
                <span>
                  <strong className="text-sage-action">{pctP}% P</strong> •{' '}
                  <strong className="text-sage-forest">{pctC}% C</strong> •{' '}
                  <strong className="text-sage-muted">{pctF}% F</strong>
                </span>
              </div>
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-sage-surface border border-sage-border/60">
                <div style={{ width: `${pctP}%` }} className="bg-sage-action" title={`Protein: ${pctP}%`} />
                <div style={{ width: `${pctC}%` }} className="bg-sage-forest" title={`Carbs: ${pctC}%`} />
                <div style={{ width: `${pctF}%` }} className="bg-sage-sage" title={`Fat: ${pctF}%`} />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-sage-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-sage-muted hover:text-sage-forest hover:bg-sage-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-sage-action hover:bg-sage-forest px-5 py-2.5 text-xs font-bold text-white shadow-card active:scale-95 transition-all"
            >
              <Check className="h-4 w-4" />
              <span>{entry ? 'Update Entry' : 'Log Nutrition'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
