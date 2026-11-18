import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Activity,
  Dumbbell,
  Flame,
  Moon,
  Sparkles,
  Calendar,
  RefreshCw,
  Plus,
  Zap,
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { api } from '../services/api';
import { OverviewCard } from '../components/dashboard/OverviewCard';
import { TargetsBanner } from '../components/dashboard/TargetsBanner';
import { ACWRGauge } from '../components/dashboard/ACWRGauge';
import { StrengthChart } from '../components/dashboard/StrengthChart';
import { VolumeChart } from '../components/dashboard/VolumeChart';
import { MacroDistribution } from '../components/dashboard/MacroDistribution';
import { RecentActivityList } from '../components/dashboard/RecentActivityList';
import { ActivityRing3D } from '../components/dashboard/ActivityRing3D';
import { Card3D } from '../components/common/Card3D';
import { CardSkeleton, ChartSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';

export const Dashboard = () => {
  const { openChat } = useOutletContext() || {};
  const {
    user,
    dashboardData,
    loadingDashboard,
    dashboardError,
    refreshDashboard,
    targetsData,
  } = useFitness();

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [volumeTrends, setVolumeTrends] = useState([]);
  const [strengthTrends, setStrengthTrends] = useState([]);
  const [loadingCharts, setLoadingCharts] = useState(false);

  useEffect(() => {
    refreshDashboard(fromDate, toDate);
  }, [refreshDashboard, fromDate, toDate]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoadingCharts(true);
      try {
        const [vol, str] = await Promise.all([
          api.getVolume('weekly').catch(() => []),
          api.getStrength().catch(() => []),
        ]);
        setVolumeTrends(vol);
        setStrengthTrends(str);
      } catch (err) {
        console.error("Failed to load analytics trends:", err);
      } finally {
        setLoadingCharts(false);
      }
    };
    fetchAnalytics();
  }, [dashboardData]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    refreshDashboard(fromDate, toDate);
  };

  const handleResetFilter = () => {
    setFromDate('');
    setToDate('');
    refreshDashboard('', '');
  };

  if (loadingDashboard && !dashboardData) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded-xl bg-sage-mint/40 animate-pulse"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <ErrorState
        title="Failed to load fitness dashboard"
        message={dashboardError}
        onRetry={() => refreshDashboard(fromDate, toDate)}
      />
    );
  }

  const totals = dashboardData?.totals || {};
  const latestE1rm = dashboardData?.latest_e1rm || {};
  const todayNutrition = dashboardData?.today_nutrition || {};
  const lastReadiness = dashboardData?.last_readiness || {};
  const acwr = dashboardData?.acwr;
  const recent = dashboardData?.recent_activity;
  const isEmpty = dashboardData?.is_empty || { overall: true };

  // Calculate top E1RM for highlight
  const topE1rmLift = Object.entries(latestE1rm)
    .filter(([_, val]) => val !== null && val > 0)
    .sort((a, b) => b[1] - a[1])[0];

  // Daily energy & maintenance metrics
  const targetCals = user?.target_calories || targetsData?.daily_target_calories || 2000;
  const consumedCals = todayNutrition.calories || 0;
  const calDifference = targetCals - consumedCals;
  const targetProtein = user?.target_protein_g || targetsData?.macro_targets?.protein_g || 150;
  const consumedProtein = todayNutrition.protein_g || 0;
  const currentVolume = totals.total_volume_kg || 0;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-sage-forest flex items-center gap-2">
            <span>Fitness Intelligence Dashboard</span>
          </h1>
          <p className="text-xs text-sage-muted mt-0.5">
            Real-time biometric analytics calculated from verified database logs
          </p>
        </div>

        {/* Date Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={handleApplyFilter} className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-xl border border-sage-border bg-white px-2.5 py-1.5 text-xs text-sage-forest focus:border-sage-action focus:outline-none shadow-sm"
              title="From date filter"
              aria-label="From date"
            />
            <span className="text-sage-muted text-xs">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-xl border border-sage-border bg-white px-2.5 py-1.5 text-xs text-sage-forest focus:border-sage-action focus:outline-none shadow-sm"
              title="To date filter"
              aria-label="To date"
            />
            <button
              type="submit"
              className="rounded-xl border border-sage-border bg-white px-3 py-1.5 text-xs font-semibold text-sage-forest hover:bg-sage-surface transition-colors shadow-sm"
            >
              Filter
            </button>
            {(fromDate || toDate) && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="text-xs text-sage-muted hover:text-sage-forest underline"
              >
                Reset
              </button>
            )}
          </form>

          <button
            onClick={() => refreshDashboard(fromDate, toDate)}
            className="rounded-xl border border-sage-border bg-white p-2 text-sage-muted hover:text-sage-forest hover:bg-sage-surface transition-colors shadow-sm"
            title="Refresh Dashboard"
            aria-label="Refresh Dashboard"
          >
            <RefreshCw className={`h-4 w-4 ${loadingDashboard ? 'animate-spin text-sage-action' : ''}`} />
          </button>
        </div>
      </div>

      {/* Global Empty State Banner if clean new user */}
      {isEmpty.overall && (
        <EmptyState
          title="Welcome to MyFitSync! No data recorded yet."
          description="Type what you did in natural English to instantly populate your dashboard (e.g. 'Squats 100 kg 5 reps 3 sets at RPE 8, ate 2200 kcal with 160 g protein, slept 7 hours.')"
          actionText="Log with Chat Assistant"
          onAction={openChat}
        />
      )}

      {/* Energy Expenditure & Macro Targets (Phase 1) */}
      <TargetsBanner />

      {/* 3D Activity Rings & Daily Maintenance Bento Tile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive 3D Activity Ring Card */}
        <Card3D className="lg:col-span-1 rounded-2xl border border-sage-border bg-white p-6 shadow-card flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-sage-forest">Daily Focus Rings</h3>
              <p className="text-[11px] text-sage-muted">Interactive 3D activity metric orbits</p>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-bold text-sage-action bg-sage-mint px-2 py-0.5 rounded-full">
              <Zap className="h-3 w-3" /> Live 3D
            </span>
          </div>

          <div className="my-2">
            <ActivityRing3D
              calories={consumedCals}
              targetCalories={targetCals}
              volume={currentVolume}
              targetVolume={2500}
              protein={consumedProtein}
              targetProtein={targetProtein}
              size={210}
            />
          </div>

          <div className="w-full grid grid-cols-3 gap-2 pt-3 border-t border-sage-border text-center text-[10px]">
            <div>
              <div className="flex items-center justify-center gap-1 text-sage-action font-bold">
                <span className="h-2 w-2 rounded-full bg-sage-action inline-block"></span> Energy
              </div>
              <span className="text-sage-muted font-medium">{consumedCals}/{targetCals}</span>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-sage-forest font-bold">
                <span className="h-2 w-2 rounded-full bg-sage-forest inline-block"></span> Volume
              </div>
              <span className="text-sage-muted font-medium">{currentVolume}kg</span>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-sage-sage font-bold">
                <span className="h-2 w-2 rounded-full bg-sage-sage inline-block"></span> Protein
              </div>
              <span className="text-sage-muted font-medium">{consumedProtein}/{targetProtein}g</span>
            </div>
          </div>
        </Card3D>

        {/* Daily Calorie Maintenance & Biometric Intelligence Card */}
        <Card3D className="lg:col-span-2 rounded-2xl border border-sage-border bg-white p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-mint text-sage-action border border-sage-sage/30 shadow-sm" style={{ transform: 'translateZ(15px)' }}>
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-sage-forest">Daily Maintenance & Energy Balance</h3>
                  <p className="text-xs text-sage-muted">Sports-science estimated expenditure based on Mifflin-St Jeor formula</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sage-surface border border-sage-border text-sage-forest">
                {user?.goal ? `${user.goal.toUpperCase()} PHASE` : 'MAINTENANCE'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className="rounded-xl bg-sage-surface/80 p-3.5 border border-sage-border/60">
                <span className="text-[10px] uppercase font-bold text-sage-muted tracking-wider">Maintenance TDEE</span>
                <div className="text-xl font-black text-sage-forest mt-1">
                  {targetsData?.tdee_calories || '—'} <span className="text-xs font-medium text-sage-muted">kcal</span>
                </div>
                <span className="text-[10px] text-sage-muted">Estimated daily burn</span>
              </div>

              <div className="rounded-xl bg-sage-surface/80 p-3.5 border border-sage-border/60">
                <span className="text-[10px] uppercase font-bold text-sage-muted tracking-wider">Target Intake</span>
                <div className="text-xl font-black text-sage-forest mt-1">
                  {user?.hide_calorie_targets ? '—' : `${targetCals}`} <span className="text-xs font-medium text-sage-muted">kcal</span>
                </div>
                <span className="text-[10px] text-sage-muted">Goal-adjusted target</span>
              </div>

              <div className="rounded-xl bg-sage-surface/80 p-3.5 border border-sage-border/60">
                <span className="text-[10px] uppercase font-bold text-sage-muted tracking-wider">Logged Intake</span>
                <div className="text-xl font-black text-sage-action mt-1">
                  {user?.hide_calorie_targets ? '—' : `${consumedCals}`} <span className="text-xs font-medium text-sage-muted">kcal</span>
                </div>
                <span className="text-[10px] text-sage-muted">{todayNutrition.meals_count || 0} meals logged</span>
              </div>

              <div className="rounded-xl bg-sage-mint/40 p-3.5 border border-sage-sage/30">
                <span className="text-[10px] uppercase font-bold text-sage-forest tracking-wider">Remaining Balance</span>
                <div className="text-xl font-black text-sage-forest mt-1">
                  {user?.hide_calorie_targets ? '—' : `${Math.abs(calDifference)}`} <span className="text-xs font-medium text-sage-muted">kcal</span>
                </div>
                <span className="text-[10px] font-semibold text-sage-action">
                  {calDifference >= 0 ? 'Remaining to target' : 'Above target threshold'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-sage-surface/50 border border-sage-border flex items-center justify-between text-xs text-sage-muted">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-sage-action" />
              Mindful nutrition approach: prioritize whole proteins, fiber and consistent training recovery.
            </span>
            <span className="font-semibold text-sage-forest">{todayNutrition.calories_pct || 0}% target reached</span>
          </div>
        </Card3D>
      </div>

      {/* 6 Key Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <OverviewCard
          title="Total Volume"
          value={totals.total_volume_kg ? `${totals.total_volume_kg}` : '0'}
          unit="kg"
          subtitle={`${totals.workouts_count || 0} sets recorded`}
          icon={Dumbbell}
          color="cyan"
        />

        <OverviewCard
          title="Key 1RM"
          value={topE1rmLift ? `${topE1rmLift[1]}` : '-'}
          unit="kg"
          subtitle={topE1rmLift ? topE1rmLift[0].replace('_', ' ') : 'No 1RM yet'}
          icon={Activity}
          color="lime"
        />

        <OverviewCard
          title="Today Calories"
          value={user?.hide_calorie_targets ? '—' : todayNutrition.calories ? `${todayNutrition.calories}` : '0'}
          unit={user?.hide_calorie_targets ? '' : 'kcal'}
          subtitle={user?.hide_calorie_targets ? 'Mindful mode active' : `${todayNutrition.calories_pct || 0}% of target`}
          icon={Flame}
          color="amber"
        />

        <OverviewCard
          title="Today Protein"
          value={todayNutrition.protein_g ? `${todayNutrition.protein_g}` : '0'}
          unit="g"
          subtitle={user?.target_protein_g ? `Goal: ${user.target_protein_g}g` : 'Logged protein'}
          icon={Flame}
          color="lime"
        />

        <OverviewCard
          title="Last Sleep"
          value={lastReadiness.sleep_hours ? `${lastReadiness.sleep_hours}` : '-'}
          unit="hrs"
          subtitle={lastReadiness.logged_date ? `Logged ${lastReadiness.logged_date}` : 'No recovery log'}
          icon={Moon}
          color="violet"
        />

        <OverviewCard
          title="Resting HR"
          value={lastReadiness.resting_hr ? `${lastReadiness.resting_hr}` : '-'}
          unit="bpm"
          subtitle={lastReadiness.soreness_score ? `Soreness ${lastReadiness.soreness_score}/10` : 'Cardiovascular rest'}
          icon={Activity}
          color="rose"
        />
      </div>

      {/* Primary Analytics Section: ACWR + Nutrition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ACWRGauge acwrData={acwr} />
        <MacroDistribution todayNutrition={todayNutrition} />
      </div>

      {/* Charts Section: Strength Progression + Weekly Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StrengthChart strengthTrends={strengthTrends} />
        <VolumeChart volumeData={volumeTrends} />
      </div>

      {/* Recent Activity Feed */}
      <div>
        <RecentActivityList recentActivity={recent} />
      </div>
    </div>
  );
};
