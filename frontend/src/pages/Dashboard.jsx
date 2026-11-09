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
  MessageSquare,
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { api } from '../services/api';
import { OverviewCard } from '../components/dashboard/OverviewCard';
import { ACWRGauge } from '../components/dashboard/ACWRGauge';
import { StrengthChart } from '../components/dashboard/StrengthChart';
import { VolumeChart } from '../components/dashboard/VolumeChart';
import { MacroDistribution } from '../components/dashboard/MacroDistribution';
import { RecentActivityList } from '../components/dashboard/RecentActivityList';
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
        <div className="h-8 w-48 rounded bg-slate-800 animate-pulse"></div>
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

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>Fitness Intelligence Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
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
              className="rounded-xl border border-slate-800 bg-[#131B2A] px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
              title="From date filter"
              aria-label="From date"
            />
            <span className="text-slate-500 text-xs">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-xl border border-slate-800 bg-[#131B2A] px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
              title="To date filter"
              aria-label="To date"
            />
            <button
              type="submit"
              className="rounded-xl border border-slate-800 bg-[#131B2A] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Filter
            </button>
            {(fromDate || toDate) && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="text-xs text-slate-500 hover:text-slate-300 underline"
              >
                Reset
              </button>
            )}
          </form>

          <button
            onClick={() => refreshDashboard(fromDate, toDate)}
            className="rounded-xl border border-slate-800 bg-[#131B2A] p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh Dashboard"
            aria-label="Refresh Dashboard"
          >
            <RefreshCw className={`h-4 w-4 ${loadingDashboard ? 'animate-spin text-emerald-400' : ''}`} />
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
          color="emerald"
        />

        <OverviewCard
          title="Today Calories"
          value={todayNutrition.calories ? `${todayNutrition.calories}` : '0'}
          unit="kcal"
          subtitle={`${todayNutrition.calories_pct || 0}% of target`}
          icon={Flame}
          color="amber"
        />

        <OverviewCard
          title="Today Protein"
          value={todayNutrition.protein_g ? `${todayNutrition.protein_g}` : '0'}
          unit="g"
          subtitle={user?.target_protein_g ? `Goal: ${user.target_protein_g}g` : 'Logged protein'}
          icon={Flame}
          color="cyan"
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
