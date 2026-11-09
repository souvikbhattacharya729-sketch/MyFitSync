import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ACWRGauge } from '../components/dashboard/ACWRGauge';
import { OverviewCard } from '../components/dashboard/OverviewCard';
import { MacroDistribution } from '../components/dashboard/MacroDistribution';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Activity } from 'lucide-react';

describe('Dashboard Widgets & Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ACWRGauge Component', () => {
    it('displays mandatory clinical disclaimer per Section 7', () => {
      render(
        <ACWRGauge
          acwrData={{
            acute_load: 12000,
            chronic_load: 10000,
            acwr: 1.2,
            zone: 'optimal',
            status: 'calculated',
            days_of_history: 28,
            disclaimer: 'The Acute:Chronic Workload Ratio is an evidence-based training load monitoring metric, not a clinical diagnostic tool or medical predictor.',
          }}
        />
      );

      expect(screen.getByText(/Optimal Load/i)).toBeInTheDocument();
      expect(screen.getByText('1.20')).toBeInTheDocument();
      expect(screen.getByText(/evidence-based training load monitoring metric/i)).toBeInTheDocument();
    });

    it('renders insufficient data state when history is under 14 days', () => {
      render(
        <ACWRGauge
          acwrData={{
            acwr: null,
            status: 'insufficient_history',
            zone: 'insufficient_data',
            days_of_history: 5,
            disclaimer: 'Building baseline history.',
          }}
        />
      );

      expect(screen.getByText(/insufficient data/i)).toBeInTheDocument();
      expect(screen.getByText(/requires at least 14 days/i)).toBeInTheDocument();
    });
  });

  describe('OverviewCard Component', () => {
    it('renders label, value, unit, and icon correctly', () => {
      render(
        <OverviewCard
          title="Total Workouts"
          value="18"
          unit="sessions"
          icon={Activity}
          color="emerald"
        />
      );

      expect(screen.getByText('Total Workouts')).toBeInTheDocument();
      expect(screen.getByText('18')).toBeInTheDocument();
      expect(screen.getByText('sessions')).toBeInTheDocument();
    });
  });

  describe('MacroDistribution Component', () => {
    it('renders macro breakdown and flags discrepancy when Atwater exceeds 10%', () => {
      render(
        <MacroDistribution
          todayNutrition={{
            calories: 2500,
            target_calories: 2400,
            protein_g: 150,
            carbs_g: 200,
            fat_g: 65,
            calories_pct: 104,
            macro_split: {
              discrepancy_flag: true,
              discrepancy_percentage: 12.5,
            },
          }}
        />
      );

      expect(screen.getByText('Daily Nutrition')).toBeInTheDocument();
      expect(screen.getByText(/150g/)).toBeInTheDocument();
      expect(screen.getByText(/200g/)).toBeInTheDocument();
      expect(screen.getByText(/65g/)).toBeInTheDocument();
      expect(screen.getByText(/differ from macro-derived calories/i)).toBeInTheDocument();
    });
  });

  describe('Empty & Error States', () => {
    it('renders EmptyState with action button', () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          title="No data found"
          description="You haven't logged any workouts yet."
          actionText="Log Workout"
          onAction={handleAction}
        />
      );

      expect(screen.getByText('No data found')).toBeInTheDocument();
      const actionBtn = screen.getByRole('button', { name: /log workout/i });
      fireEvent.click(actionBtn);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('renders ErrorState with retry trigger', () => {
      const handleRetry = vi.fn();
      render(<ErrorState message="Server connection failed" onRetry={handleRetry} />);

      expect(screen.getByText('Server connection failed')).toBeInTheDocument();
      const retryBtn = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });
});
