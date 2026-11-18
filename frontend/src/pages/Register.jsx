import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  ChevronUp, 
  SlidersHorizontal 
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';

export const Register = () => {
  const { register, login } = useFitness();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Optional athletic baseline parameters (pre-populated with sensible defaults)
  const [showProfileOptions, setShowProfileOptions] = useState(false);
  const [bodyweightKg, setBodyweightKg] = useState(75.0);
  const [heightCm, setHeightCm] = useState(175.0);
  const [age, setAge] = useState(25);
  const [sex, setSex] = useState('male');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [goal, setGoal] = useState('maintain');
  const [targetCalories, setTargetCalories] = useState(2500);
  const [targetProteinG, setTargetProteinG] = useState(160);
  const [timezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 10) {
      setError('Password must be at least 10 characters in length.');
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        bodyweight_kg: parseFloat(bodyweightKg) || 75.0,
        height_cm: heightCm ? parseFloat(heightCm) : 175.0,
        age: age ? parseInt(age, 10) : 25,
        sex: sex || 'male',
        activity_level: activityLevel || 'moderate',
        goal: goal || 'maintain',
        target_calories: parseInt(targetCalories, 10) || 2500,
        target_protein_g: targetProteinG ? parseFloat(targetProteinG) : 160,
        timezone,
      });

      // Automatically sign in upon registration
      await login({ email: email.trim().toLowerCase(), password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F6FAF7] text-[#263D32] flex flex-col justify-center items-center px-4 py-12 selection:bg-[#DCEFE3] selection:text-[#263D32]">
      <div className="w-full max-w-[480px]">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DCEFE3] text-[#6BA985] border border-[#A8D5B5]/40 shadow-sm group-hover:scale-105 transition-transform mb-3">
              <Activity className="h-6 w-6 stroke-[2.2]" />
            </div>
            <span className="text-2xl font-black text-[#263D32] tracking-tight">
              MyFitSync
            </span>
            <span className="text-[11px] font-bold text-[#77847C] uppercase tracking-widest mt-1">
              Your Personal Fitness Intelligence
            </span>
          </Link>
        </div>

        {/* Clean Centered Auth Card (Strictly Image-Free) */}
        <div className="rounded-3xl border border-[#E5EDE7] bg-white p-7 sm:p-9 shadow-[0_10px_35px_-5px_rgba(38,61,50,0.06),0_2px_6px_-1px_rgba(38,61,50,0.03)]">
          <div className="mb-6 text-center sm:text-left">
            <h1 className="text-2xl font-black text-[#263D32] tracking-tight">
              Create Your Account
            </h1>
            <p className="text-xs sm:text-sm text-[#77847C] mt-1 leading-relaxed">
              Start building a stronger, healthier you.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#263D32] mb-1.5 tracking-wide">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#77847C] pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Mercer"
                  className="w-full rounded-xl border border-[#E5EDE7] bg-[#F6FAF7] pl-10 pr-4 py-3 text-sm text-[#263D32] placeholder-[#77847C] focus:bg-white focus:border-[#6BA985] focus:outline-none focus:ring-2 focus:ring-[#6BA985]/20 shadow-sm transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#263D32] mb-1.5 tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#77847C] pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full rounded-xl border border-[#E5EDE7] bg-[#F6FAF7] pl-10 pr-4 py-3 text-sm text-[#263D32] placeholder-[#77847C] focus:bg-white focus:border-[#6BA985] focus:outline-none focus:ring-2 focus:ring-[#6BA985]/20 shadow-sm transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#263D32] mb-1.5 tracking-wide">
                Password <span className="text-[#77847C] font-normal">(minimum 10 characters)</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#77847C] pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-[#E5EDE7] bg-[#F6FAF7] pl-10 pr-11 py-3 text-sm text-[#263D32] placeholder-[#77847C] focus:bg-white focus:border-[#6BA985] focus:outline-none focus:ring-2 focus:ring-[#6BA985]/20 shadow-sm transition-all font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#77847C] hover:text-[#263D32] transition-colors rounded-lg focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#263D32] mb-1.5 tracking-wide">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#77847C] pointer-events-none" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full rounded-xl border border-[#E5EDE7] bg-[#F6FAF7] pl-10 pr-11 py-3 text-sm text-[#263D32] placeholder-[#77847C] focus:bg-white focus:border-[#6BA985] focus:outline-none focus:ring-2 focus:ring-[#6BA985]/20 shadow-sm transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#77847C] hover:text-[#263D32] transition-colors rounded-lg focus:outline-none"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Optional Collapsible Athletic Profile Customization */}
            <div className="rounded-2xl border border-[#E5EDE7] bg-[#EDF5EF]/50 overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setShowProfileOptions(!showProfileOptions)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-[#263D32] hover:bg-[#DCEFE3]/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-[#6BA985]" />
                  Personalize Athletic Baseline (Optional)
                </span>
                {showProfileOptions ? (
                  <ChevronUp className="h-4 w-4 text-[#77847C]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[#77847C]" />
                )}
              </button>

              {!showProfileOptions ? (
                <div className="px-4 pb-3 text-[11px] text-[#77847C] leading-relaxed">
                  Default parameters active ({bodyweightKg} kg • {heightCm} cm • {activityLevel} • {goal}). You can customize these now or anytime in Settings.
                </div>
              ) : (
                <div className="p-4 pt-1 space-y-3 border-t border-[#E5EDE7]">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#263D32] mb-1">Bodyweight (kg)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="20"
                        max="300"
                        value={bodyweightKg}
                        onChange={(e) => setBodyweightKg(e.target.value)}
                        className="w-full rounded-xl border border-[#E5EDE7] bg-white px-3 py-2 text-xs text-[#263D32] font-semibold focus:border-[#6BA985] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#263D32] mb-1">Height (cm)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="100"
                        max="250"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        className="w-full rounded-xl border border-[#E5EDE7] bg-white px-3 py-2 text-xs text-[#263D32] font-semibold focus:border-[#6BA985] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#263D32] mb-1">Age</label>
                      <input
                        type="number"
                        min="13"
                        max="100"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full rounded-xl border border-[#E5EDE7] bg-white px-3 py-2 text-xs text-[#263D32] font-semibold focus:border-[#6BA985] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#263D32] mb-1">Biological Sex</label>
                      <select
                        value={sex}
                        onChange={(e) => setSex(e.target.value)}
                        className="w-full rounded-xl border border-[#E5EDE7] bg-white px-2.5 py-2 text-xs text-[#263D32] font-medium focus:border-[#6BA985] focus:outline-none"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#263D32] mb-1">Activity Level</label>
                      <select
                        value={activityLevel}
                        onChange={(e) => setActivityLevel(e.target.value)}
                        className="w-full rounded-xl border border-[#E5EDE7] bg-white px-2.5 py-2 text-xs text-[#263D32] font-medium focus:border-[#6BA985] focus:outline-none"
                      >
                        <option value="sedentary">Sedentary (1.2x)</option>
                        <option value="light">Light exercise (1.375x)</option>
                        <option value="moderate">Moderate exercise (1.55x)</option>
                        <option value="very_active">Very active (1.725x)</option>
                        <option value="extra_active">Extra active (1.9x)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#263D32] mb-1">Primary Goal</label>
                      <select
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        className="w-full rounded-xl border border-[#E5EDE7] bg-white px-2.5 py-2 text-xs text-[#263D32] font-medium focus:border-[#6BA985] focus:outline-none"
                      >
                        <option value="lose">Fat Loss (−500 kcal)</option>
                        <option value="maintain">Maintenance (TDEE)</option>
                        <option value="gain">Lean Gain (+300 kcal)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#6BA985] hover:bg-[#263D32] py-3.5 px-6 text-sm font-bold text-white shadow-[0_4px_16px_rgba(107,169,133,0.25)] hover:shadow-[0_6px_20px_rgba(38,61,50,0.18)] disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] transition-all cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center gap-2 text-white">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </div>
              ) : (
                <>
                  <span className="text-white font-bold">Create Account</span>
                  <ArrowRight className="h-4 w-4 text-white" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Navigation */}
        <p className="mt-8 text-center text-xs text-[#77847C]">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#6BA985] hover:text-[#263D32] hover:underline transition-colors ml-1">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};
