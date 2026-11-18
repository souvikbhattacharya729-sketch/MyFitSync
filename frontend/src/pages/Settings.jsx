import React, { useState, useEffect } from 'react';
import { 
  User, 
  Settings as SettingsIcon, 
  Target, 
  Scale, 
  Flame, 
  CheckCircle, 
  AlertCircle, 
  Globe, 
  ShieldCheck,
  HeartHandshake,
  EyeOff,
  Eye,
  Info,
  Sparkles,
  Sun
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { Card3D } from '../components/common/Card3D';

export const Settings = () => {
  const { user, updateProfile, targetsData, loadingTargets } = useFitness();

  const [name, setName] = useState('');
  const [bodyweight, setBodyweight] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [goal, setGoal] = useState('');
  const [hideCalorieTargets, setHideCalorieTargets] = useState(false);
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
      setHeightCm(user.height_cm ? user.height_cm.toString() : '');
      setAge(user.age ? user.age.toString() : '');
      setSex(user.sex || '');
      setActivityLevel(user.activity_level || '');
      setGoal(user.goal || '');
      setHideCalorieTargets(!!user.hide_calorie_targets);
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
        height_cm: heightCm !== '' ? parseFloat(heightCm) : null,
        age: age !== '' ? parseInt(age, 10) : null,
        sex: sex || null,
        activity_level: activityLevel || null,
        goal: goal || null,
        hide_calorie_targets: hideCalorieTargets,
        target_calories: targetCalories ? parseInt(targetCalories, 10) : undefined,
        target_protein_g: targetProtein !== '' ? parseFloat(targetProtein) : undefined,
        target_carbs_g: targetCarbs !== '' ? parseFloat(targetCarbs) : undefined,
        target_fat_g: targetFat !== '' ? parseFloat(targetFat) : undefined,
        timezone: timezone.trim() || 'UTC',
      };

      await updateProfile(payload);
      setSuccessMessage('Profile, biometric parameters, and preferences updated successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyCalculatedTargets = () => {
    if (targetsData && targetsData.calorie_target && targetsData.macros) {
      setTargetCalories(targetsData.calorie_target.toString());
      setTargetProtein(targetsData.macros.protein_g.toString());
      setTargetCarbs(targetsData.macros.carbs_g.toString());
      setTargetFat(targetsData.macros.fat_g.toString());
      setSuccessMessage('Calculated scientific targets copied into your target inputs. Click "Save Preferences" to persist.');
      setTimeout(() => setSuccessMessage(null), 4000);
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

  const isProfileComplete = !!(
    user?.bodyweight_kg &&
    user?.height_cm &&
    user?.age &&
    user?.sex &&
    user?.activity_level &&
    user?.goal
  );

  return (
    <div className="max-w-4xl space-y-6 text-sage-forest">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-sage-forest">Settings & Profile</h1>
        <p className="text-xs text-sage-muted mt-0.5">
          Manage your biometric profile, energy expenditure parameters, and mindful tracking preferences.
        </p>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-sage-sage/50 bg-sage-mint/40 p-4 text-xs font-semibold text-sage-forest shadow-sm">
          <CheckCircle className="h-5 w-5 shrink-0 text-sage-action" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 shadow-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Complete Profile Notification Banner if Incomplete */}
      {!isProfileComplete && (
        <Card3D className="rounded-2xl border border-sage-border bg-white p-5 shadow-card">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-sage-mint text-sage-action border border-sage-sage/20">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-sage-forest">Complete your athletic profile</h3>
              <p className="text-xs text-sage-muted mt-1 leading-relaxed">
                Provide your height, age, biological sex, activity level, and goal below to unlock personalized BMR, TDEE, and evidence-based macro targets.
              </p>
            </div>
          </div>
        </Card3D>
      )}

      {/* Eating Disorder & Supportive Health Notice */}
      <Card3D className="rounded-2xl border border-sage-border bg-white p-5 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-sage-mint text-sage-action border border-sage-sage/20 shrink-0">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-sage-forest">Mindful & Supportive Health</h3>
            <p className="text-xs text-sage-muted mt-0.5 leading-relaxed">
              If tracking numbers ever feels stressful or overwhelming, remember that professional support is available. 
              You can also hide calorie numbers anytime using the toggle below.
            </p>
          </div>
        </div>
        <a
          href="https://www.nationaleatingdisorders.org"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-4 py-2 rounded-xl border border-sage-border bg-sage-surface hover:bg-sage-mint text-xs font-bold text-sage-forest transition-colors shadow-sm"
        >
          Professional Resources & Help →
        </a>
      </Card3D>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Biometric & Calorie Goal Card */}
        <Card3D className="rounded-2xl border border-sage-border bg-white p-6 shadow-card space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-sage-border">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-mint text-sage-action border border-sage-sage/30">
              <User className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-sage-forest">Biometrics & Activity Baseline</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-sage-forest mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-sage-border bg-white px-3.5 py-2.5 text-sm text-sage-forest focus:border-sage-action focus:outline-none focus:ring-1 focus:ring-sage-action shadow-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sage-muted mb-1.5">
                Account Email
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full rounded-xl border border-sage-border bg-sage-surface/60 px-3.5 py-2.5 text-sm text-sage-muted cursor-not-allowed font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-sage-forest">
                  Bodyweight ({unit})
                </label>
                <div className="flex items-center rounded-lg bg-sage-surface border border-sage-border p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleUnitToggle('kg')}
                    className={`px-2 py-0.5 rounded-md font-bold transition-colors ${unit === 'kg' ? 'bg-sage-action text-white shadow-sm' : 'text-sage-muted hover:text-sage-forest'}`}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnitToggle('lb')}
                    className={`px-2 py-0.5 rounded-md font-bold transition-colors ${unit === 'lb' ? 'bg-sage-action text-white shadow-sm' : 'text-sage-muted hover:text-sage-forest'}`}
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
                required
                value={bodyweight}
                onChange={(e) => setBodyweight(e.target.value)}
                className="w-full rounded-xl border border-sage-border bg-white px-3.5 py-2.5 text-sm text-sage-forest focus:border-sage-action focus:outline-none focus:ring-1 focus:ring-sage-action shadow-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sage-forest mb-1.5">
                Height (cm)
              </label>
              <input
                type="number"
                step="0.5"
                min="100"
                max="250"
                placeholder="e.g. 178"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="w-full rounded-xl border border-sage-border bg-white px-3.5 py-2.5 text-sm text-sage-forest focus:border-sage-action focus:outline-none focus:ring-1 focus:ring-sage-action shadow-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sage-forest mb-1.5">
                Age (years)
              </label>
              <input
                type="number"
                min="13"
                max="100"
                placeholder="e.g. 26"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full rounded-xl border border-sage-border bg-white px-3.5 py-2.5 text-sm text-sage-forest focus:border-sage-action focus:outline-none focus:ring-1 focus:ring-sage-action shadow-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sage-forest mb-1.5">
                Biological Sex
              </label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="w-full rounded-xl border border-sage-border bg-white px-3.5 py-2.5 text-sm text-sage-forest focus:border-sage-action focus:outline-none focus:ring-1 focus:ring-sage-action shadow-sm font-medium"
              >
                <option value="">Select Biological Sex</option>
                <option value="male">Male (Mifflin-St Jeor formula)</option>
                <option value="female">Female (Mifflin-St Jeor formula)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-sage-forest mb-1.5">
                Activity Level
              </label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
                className="w-full rounded-xl border border-sage-border bg-white px-3.5 py-2.5 text-sm text-sage-forest focus:border-sage-action focus:outline-none focus:ring-1 focus:ring-sage-action shadow-sm font-medium"
              >
                <option value="">Select Activity Multiplier</option>
                <option value="sedentary">Sedentary (Desk work, little exercise: 1.2x)</option>
                <option value="light">Light (1–3 training sessions/week: 1.375x)</option>
                <option value="moderate">Moderate (3–5 training sessions/week: 1.55x)</option>
                <option value="very_active">Very Active (6–7 hard training days: 1.725x)</option>
                <option value="extra_active">Extra Active (Intense daily/physical job: 1.9x)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-sage-forest mb-1.5">
                Primary Goal
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full rounded-xl border border-sage-border bg-white px-3.5 py-2.5 text-sm text-sage-forest focus:border-sage-action focus:outline-none focus:ring-1 focus:ring-sage-action shadow-sm font-medium"
              >
                <option value="">Select Goal</option>
                <option value="lose">Fat Loss (−500 kcal deficit)</option>
                <option value="maintain">Maintenance (TDEE balance)</option>
                <option value="gain">Lean Gain (+300 kcal surplus)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-sage-forest mb-1.5">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-xl border border-sage-border bg-white px-3.5 py-2.5 text-sm text-sage-forest focus:border-sage-action focus:outline-none focus:ring-1 focus:ring-sage-action shadow-sm font-medium"
              >
                {commonTimezones.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>
        </Card3D>

        {/* Scientific Targets Card (Phase 1) */}
        {targetsData && targetsData.profile_complete && (
          <Card3D className="rounded-2xl border border-sage-border bg-white p-6 shadow-card space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sage-border">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-mint text-sage-action border border-sage-sage/30">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-sage-forest">Calculated Energy & Macro Estimates</h2>
                  <p className="text-[11px] text-sage-muted">Mifflin-St Jeor & evidence-based sports science</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleApplyCalculatedTargets}
                className="px-4 py-2 rounded-xl border border-sage-action bg-sage-mint text-xs font-bold text-sage-action hover:bg-sage-sage/30 transition-colors shadow-sm self-start sm:self-auto"
              >
                Use Estimates for My Targets
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl border border-sage-border bg-sage-surface/60 p-4">
                <span className="text-[10px] font-bold uppercase text-sage-muted block tracking-wider">BMR</span>
                <span className="text-xl font-black text-sage-forest mt-1 block">{targetsData.bmr}</span>
                <span className="text-[10px] text-sage-muted">Basal rate (kcal/day)</span>
              </div>

              <div className="rounded-xl border border-sage-border bg-sage-surface/60 p-4">
                <span className="text-[10px] font-bold uppercase text-sage-muted block tracking-wider">TDEE</span>
                <span className="text-xl font-black text-sage-forest mt-1 block">{targetsData.tdee}</span>
                <span className="text-[10px] text-sage-muted">Total expenditure</span>
              </div>

              <div className="rounded-xl border border-sage-sage/40 bg-sage-mint/40 p-4">
                <span className="text-[10px] font-bold uppercase text-sage-action block tracking-wider">Daily Target</span>
                <span className="text-xl font-black text-sage-action mt-1 block">{targetsData.calorie_target}</span>
                <span className="text-[10px] text-sage-muted">
                  {targetsData.safe_floor_applied ? 'Floor clamped (kcal)' : 'Goal target (kcal)'}
                </span>
              </div>

              <div className="rounded-xl border border-sage-border bg-sage-surface/60 p-4">
                <span className="text-[10px] font-bold uppercase text-sage-muted block tracking-wider">Protein Target</span>
                <span className="text-xl font-black text-sage-forest mt-1 block">{targetsData.macros?.protein_g}g</span>
                <span className="text-[10px] text-sage-muted">1.8g/kg bodyweight</span>
              </div>
            </div>

            {targetsData.safe_floor_applied && (
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-800 font-medium">
                ⚠️ {targetsData.floor_warning}
              </div>
            )}

            {targetsData.macros && (
              <div className="rounded-xl border border-sage-border bg-sage-surface/50 p-4 space-y-2">
                <span className="text-xs font-bold text-sage-forest block uppercase tracking-wider">
                  Macronutrient Ratio Breakdown (Atwater 4/4/9 kcal/g)
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-sage-border shadow-sm">
                    <span className="text-sage-action font-black block">{targetsData.macros.protein_g}g</span>
                    <span className="text-sage-muted text-[11px] font-medium">Protein ({targetsData.macros.protein_pct}%)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-sage-border shadow-sm">
                    <span className="text-sage-forest font-black block">{targetsData.macros.carbs_g}g</span>
                    <span className="text-sage-muted text-[11px] font-medium">Carbs ({targetsData.macros.carbs_pct}%)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-sage-border shadow-sm">
                    <span className="text-sage-muted font-black block">{targetsData.macros.fat_g}g</span>
                    <span className="text-sage-muted text-[11px] font-medium">Fat ({targetsData.macros.fat_pct}%)</span>
                  </div>
                </div>
              </div>
            )}

            <p className="text-[11px] text-sage-muted italic leading-relaxed">
              {targetsData.disclaimer}
            </p>
          </Card3D>
        )}

        {/* Nutrition Targets & Display Preference Card */}
        <Card3D className="rounded-2xl border border-sage-border bg-white p-6 shadow-card space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-sage-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-mint text-sage-action border border-sage-sage/30">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-sage-forest">Active Daily Nutrition Targets</h2>
                <p className="text-[11px] text-sage-muted">Custom override numbers for daily macro tracking</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-sage-border bg-sage-surface/60 flex items-center justify-between">
            <div className="space-y-0.5 pr-4">
              <label className="text-sm font-bold text-sage-forest flex items-center gap-2">
                {hideCalorieTargets ? <EyeOff className="h-4 w-4 text-sage-muted" /> : <Eye className="h-4 w-4 text-sage-action" />}
                Hide Calorie Numbers in Dashboard
              </label>
              <p className="text-xs text-sage-muted leading-relaxed">
                For mindful, non-numeric eating. Focus on consistent training and overall nutrition balance without displaying daily calorie counts.
              </p>
            </div>
            <input
              type="checkbox"
              checked={hideCalorieTargets}
              onChange={(e) => setHideCalorieTargets(e.target.checked)}
              className="h-5 w-5 rounded border-sage-border text-sage-action focus:ring-sage-action accent-sage-action cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-sage-forest mb-1.5">
                Target Calories (kcal)
              </label>
              <input
                type="number"
                min="500"
                max="10000"
                value={targetCalories}
                onChange={(e) => setTargetCalories(e.target.value)}
                className="w-full rounded-xl border border-sage-border bg-white px-3.5 py-2.5 text-sm text-sage-forest focus:border-sage-action focus:outline-none focus:ring-1 focus:ring-sage-action shadow-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sage-forest mb-1.5">
                Protein Target (g)
              </label>
              <input
                type="number"
                min="0"
                max="1000"
                value={targetProtein}
                onChange={(e) => setTargetProtein(e.target.value)}
                className="w-full rounded-xl border border-sage-border bg-white px-3.5 py-2.5 text-sm text-sage-forest focus:border-sage-action focus:outline-none focus:ring-1 focus:ring-sage-action shadow-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sage-forest mb-1.5">
                Carbs Target (g)
              </label>
              <input
                type="number"
                min="0"
                max="1500"
                value={targetCarbs}
                onChange={(e) => setTargetCarbs(e.target.value)}
                className="w-full rounded-xl border border-sage-border bg-white px-3.5 py-2.5 text-sm text-sage-forest focus:border-sage-action focus:outline-none focus:ring-1 focus:ring-sage-action shadow-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sage-forest mb-1.5">
                Fat Target (g)
              </label>
              <input
                type="number"
                min="0"
                max="500"
                value={targetFat}
                onChange={(e) => setTargetFat(e.target.value)}
                className="w-full rounded-xl border border-sage-border bg-white px-3.5 py-2.5 text-sm text-sage-forest focus:border-sage-action focus:outline-none focus:ring-1 focus:ring-sage-action shadow-sm font-semibold"
              />
            </div>
          </div>
        </Card3D>

        {/* System Appearance Banner (Fixed Light Theme Only) */}
        <div className="rounded-2xl border border-sage-border bg-white p-5 shadow-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-mint text-sage-action border border-sage-sage/20">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-sage-forest">System Theme: Mint & Sage</h3>
              <p className="text-xs text-sage-muted">Light theme optimized for daylight readability and minimal gym glare.</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-sage-mint text-sage-action border border-sage-sage/30">
            Active Standard
          </span>
        </div>

        {/* Save Actions */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-xl bg-sage-action hover:bg-sage-forest text-white font-bold text-sm transition-all shadow-card active:scale-95 disabled:opacity-50"
          >
            {saving ? 'Saving changes...' : 'Save Preferences'}
          </button>
        </div>
      </form>

      {/* Security & System Identifiers */}
      <div className="rounded-2xl border border-sage-border bg-white p-5 text-xs text-sage-muted space-y-2 shadow-card">
        <div className="flex items-center gap-2 font-bold text-sage-forest">
          <ShieldCheck className="h-4 w-4 text-sage-action" />
          <span>Security & Cryptographic Identity</span>
        </div>
        <p>User UUID: <span className="font-mono text-sage-forest font-semibold">{user?.user_id || '—'}</span></p>
        <p>Session Integrity: Tokens are cryptographically signed with HMAC-SHA256 and rotated with 60-minute access expiry.</p>
      </div>
    </div>
  );
};
