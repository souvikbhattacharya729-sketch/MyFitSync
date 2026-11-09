import React, { useState, useEffect } from 'react';
import { 
  User, 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Target, 
  Scale, 
  Flame, 
  CheckCircle, 
  AlertCircle, 
  Globe, 
  ShieldCheck 
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';

export const Settings = () => {
  const { user, updateProfile, theme, toggleTheme } = useFitness();

  const [name, setName] = useState('');
  const [bodyweight, setBodyweight] = useState('');
  const [unit, setUnit] = useState('kg');
  const [targetCalories, setTargetCalories] = useState('');
  const [targetProtein, setTargetProtein] = useState('');
  const [targetCarbs, setTargetCarbs] = useState('');
  const [targetFat, setTargetFat] = useState('');
  const [timezone, setTimezone] = useState('UTC');

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBodyweight(user.bodyweight_kg ? user.bodyweight_kg.toString() : '');
      setTargetCalories(user.target_calories ? user.target_calories.toString() : '');
      setTargetProtein(user.target_protein_g != null ? user.target_protein_g.toString() : '');
      setTargetCarbs(user.target_carbs_g != null ? user.target_carbs_g.toString() : '');
      setTargetFat(user.target_fat_g != null ? user.target_fat_g.toString() : '');
      setTimezone(user.timezone || 'UTC');
    }
  }, [user]);

  const handleUnitToggle = (newUnit) => {
    if (newUnit === unit) return;
    if (bodyweight) {
      const val = parseFloat(bodyweight);
      if (!isNaN(val)) {
        if (newUnit === 'lb') {
          setBodyweight((val * 2.20462).toFixed(1));
        } else {
          setBodyweight((val / 2.20462).toFixed(1));
        }
      }
    }
    setUnit(newUnit);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      let bwKg = parseFloat(bodyweight);
      if (unit === 'lb') {
        bwKg = bwKg / 2.20462;
      }

      const payload = {
        name: name.trim(),
        bodyweight_kg: !isNaN(bwKg) && bwKg > 0 ? parseFloat(bwKg.toFixed(2)) : undefined,
        target_calories: targetCalories ? parseInt(targetCalories, 10) : undefined,
        target_protein_g: targetProtein !== '' ? parseFloat(targetProtein) : undefined,
        target_carbs_g: targetCarbs !== '' ? parseFloat(targetCarbs) : undefined,
        target_fat_g: targetFat !== '' ? parseFloat(targetFat) : undefined,
        timezone: timezone.trim() || 'UTC',
      };

      await updateProfile(payload);
      setSuccessMessage('Profile and preferences updated successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  const commonTimezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Kolkata',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Australia/Sydney',
  ];

  return (
    <div className="max-w-4xl space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Settings & Preferences</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Manage your personal biometric profile, nutrition targets, display theme, and account settings.
        </p>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="rounded-2xl border border-slate-800 bg-[#131B2A] p-6 shadow-lg space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
            <User className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Athlete Profile</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-[#0B0F17] px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Account Email
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full rounded-xl border border-slate-800/50 bg-[#0B0F17]/50 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Email address cannot be changed.</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Bodyweight ({unit})
                </label>
                <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleUnitToggle('kg')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${unit === 'kg' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnitToggle('lb')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${unit === 'lb' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                  >
                    lb
                  </button>
                </div>
              </div>
              <input
                type="number"
                step="0.1"
                min="20"
                max="500"
                value={bodyweight}
                onChange={(e) => setBodyweight(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-[#0B0F17] px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-[#0B0F17] px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                {commonTimezones.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Nutrition Targets Card */}
        <div className="rounded-2xl border border-slate-800 bg-[#131B2A] p-6 shadow-lg space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
            <Flame className="h-5 w-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Daily Nutrition Targets</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Target Calories (kcal)
              </label>
              <input
                type="number"
                min="500"
                max="10000"
                value={targetCalories}
                onChange={(e) => setTargetCalories(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-[#0B0F17] px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Protein Target (g)
              </label>
              <input
                type="number"
                min="0"
                max="1000"
                value={targetProtein}
                onChange={(e) => setTargetProtein(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-[#0B0F17] px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Carbs Target (g)
              </label>
              <input
                type="number"
                min="0"
                max="1500"
                value={targetCarbs}
                onChange={(e) => setTargetCarbs(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-[#0B0F17] px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Fat Target (g)
              </label>
              <input
                type="number"
                min="0"
                max="500"
                value={targetFat}
                onChange={(e) => setTargetFat(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-[#0B0F17] px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* UI & Theme Preferences Card */}
        <div className="rounded-2xl border border-slate-800 bg-[#131B2A] p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Visual Appearance Theme</h3>
              <p className="text-xs text-slate-400 mt-0.5">Toggle between Midnight Dark (default) and High Contrast Light mode.</p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 bg-slate-900 text-sm font-semibold text-white hover:border-slate-600 transition-colors"
            >
              {theme === 'dark' ? (
                <>
                  <Moon className="h-4 w-4 text-emerald-400" />
                  Dark Theme
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4 text-amber-400" />
                  Light Theme
                </>
              )}
            </button>
          </div>
        </div>

        {/* Save Actions */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/10 active:scale-95 disabled:opacity-50"
          >
            {saving ? 'Saving changes...' : 'Save Preferences'}
          </button>
        </div>
      </form>

      {/* Security & System Identifiers */}
      <div className="rounded-2xl border border-slate-800/60 bg-[#0B0F17] p-5 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-slate-300">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Security & Cryptographic Identity</span>
        </div>
        <p>User UUID: <span className="font-mono text-slate-300">{user?.user_id || '—'}</span></p>
        <p>Session Integrity: Tokens are cryptographically signed with HMAC-SHA256 and rotated with 15-minute access expiry.</p>
      </div>
    </div>
  );
};
