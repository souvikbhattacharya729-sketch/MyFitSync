import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { TargetsBanner } from '../components/dashboard/TargetsBanner';
import * as FitnessContext from '../context/FitnessContext';

describe('Targets & Energy Expenditure (Phase 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Complete your athletic profile" prompt when biometric fields are missing', () => {
    vi.spyOn(FitnessContext, 'useFitness').mockReturnValue({
      user: { user_id: 'u1', name: 'Athlete' },
      targetsData: {
        profile_complete: false,
        missing_fields: ['height_cm', 'age', 'sex', 'activity_level', 'goal'],
        disclaimer: 'Estimates disclaimer.',
      },
      loadingTargets: false,
    });

    render(
      <BrowserRouter>
        <TargetsBanner />
      </BrowserRouter>
    );

    expect(screen.getByText(/Complete your athletic profile to calculate daily targets/i)).toBeInTheDocument();
    expect(screen.getByText(/height_cm, age, sex/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Complete Profile/i })).toBeInTheDocument();
  });

  it('renders calculated BMR, TDEE, target calories, macros, and disclaimer when profile is complete', () => {
    vi.spyOn(FitnessContext, 'useFitness').mockReturnValue({
      user: { user_id: 'u1', name: 'Athlete', hide_calorie_targets: false },
      targetsData: {
        profile_complete: true,
        missing_fields: [],
        bmr: 1780.0,
        tdee: 2759.0,
        calorie_target: 2259,
        safe_floor_applied: false,
        macros: {
          protein_g: 144.0,
          protein_kcal: 576.0,
          protein_pct: 25.5,
          fat_g: 62.8,
          fat_kcal: 564.8,
          fat_pct: 25.0,
          carbs_g: 279.6,
          carbs_kcal: 1118.2,
          carbs_pct: 49.5,
        },
        disclaimer: 'Nutritional estimates are statistical approximations, not medical advice.',
      },
      loadingTargets: false,
    });

    render(
      <BrowserRouter>
        <TargetsBanner />
      </BrowserRouter>
    );

    expect(screen.getByText(/Personal Energy & Macro Targets/i)).toBeInTheDocument();
    expect(screen.getByText('1780')).toBeInTheDocument();
    expect(screen.getByText('2759')).toBeInTheDocument();
    expect(screen.getByText('2259')).toBeInTheDocument();
    expect(screen.getByText('144g')).toBeInTheDocument();
    expect(screen.getByText(/Nutritional estimates are statistical approximations, not medical advice/i)).toBeInTheDocument();
  });

  it('respects mindful eating / hide calorie targets preference', () => {
    vi.spyOn(FitnessContext, 'useFitness').mockReturnValue({
      user: { user_id: 'u1', name: 'Athlete', hide_calorie_targets: true },
      targetsData: {
        profile_complete: true,
        hide_calorie_targets: true,
        bmr: 1780.0,
        tdee: 2759.0,
        calorie_target: 2259,
      },
      loadingTargets: false,
    });

    render(
      <BrowserRouter>
        <TargetsBanner />
      </BrowserRouter>
    );

    expect(screen.getByText(/Mindful Tracking Mode Active/i)).toBeInTheDocument();
    expect(screen.getByText(/Calorie numbers are hidden per your settings preference/i)).toBeInTheDocument();
    expect(screen.queryByText('2259')).not.toBeInTheDocument();
  });

  it('displays safe floor warning when deficit drops below safe minimums', () => {
    vi.spyOn(FitnessContext, 'useFitness').mockReturnValue({
      user: { user_id: 'u1', name: 'Athlete', hide_calorie_targets: false },
      targetsData: {
        profile_complete: true,
        bmr: 1200.0,
        tdee: 1440.0,
        calorie_target: 1200,
        safe_floor_applied: true,
        floor_warning: 'Calculated deficit is below the recommended minimum safe floor of 1200 kcal/day for females.',
        macros: {
          protein_g: 90.0,
          protein_kcal: 360.0,
          protein_pct: 30.0,
          fat_g: 33.3,
          fat_kcal: 300.0,
          fat_pct: 25.0,
          carbs_g: 135.0,
          carbs_kcal: 540.0,
          carbs_pct: 45.0,
        },
        disclaimer: 'Nutritional estimates are statistical approximations.',
      },
      loadingTargets: false,
    });

    render(
      <BrowserRouter>
        <TargetsBanner />
      </BrowserRouter>
    );

    expect(screen.getByText(/Calculated deficit is below the recommended minimum safe floor/i)).toBeInTheDocument();
  });
});
