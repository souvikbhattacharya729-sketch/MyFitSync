from datetime import date, timedelta

import pytest

from app.core.sports_science import (
    bmr,
    calculate_acwr_rolling,
    calculate_brzycki_1rm,
    calculate_macro_split,
    calculate_reps_in_reserve,
    calculate_set_volume,
    calculate_wathan_1rm,
    compute_estimated_1rm,
    daily_target,
    macro_targets,
    tdee,
)


def test_brzycki_known_values():
    # 100 kg for 5 reps: 100 * 36 / (37 - 5) = 3600 / 32 = 112.5 kg
    assert calculate_brzycki_1rm(100.0, 5) == 112.5
    # 1 rep max should be exact weight
    assert calculate_brzycki_1rm(140.0, 1) == 140.0


def test_brzycki_invalid_reps():
    with pytest.raises(ValueError, match="strictly greater than 0"):
        calculate_brzycki_1rm(100.0, 0)
    with pytest.raises(ValueError, match="strictly greater than 0"):
        calculate_brzycki_1rm(100.0, -2)
    with pytest.raises(ValueError, match="reps >= 37"):
        calculate_brzycki_1rm(100.0, 37)
    with pytest.raises(ValueError, match="reps >= 37"):
        calculate_brzycki_1rm(100.0, 45)


def test_wathan_known_values():
    # 100 kg for 5 reps: 10000 / (48.8 + 53.8 * exp(-0.375))
    e1rm = calculate_wathan_1rm(100.0, 5)
    assert 114.0 <= e1rm <= 118.0
    assert calculate_wathan_1rm(100.0, 1) == 100.0


def test_compute_estimated_1rm_ranges():
    # Reps <= 10: Valid, no warning
    p, s, warn = compute_estimated_1rm(100.0, 5)
    assert p == 112.5
    assert s is not None
    assert warn is None

    # Reps 11-12: Calculated but warning emitted
    p11, s11, warn11 = compute_estimated_1rm(100.0, 11)
    assert p11 is not None
    assert warn11 is not None and "accuracy declines" in warn11

    # Reps > 12: None stored for primary E1RM, formal validity warning emitted
    p15, s15, warn15 = compute_estimated_1rm(100.0, 15)
    assert p15 is None
    assert warn15 is not None and "exceeds valid estimation boundary" in warn15

    # Reps >= 37: Rejected safely
    p40, s40, warn40 = compute_estimated_1rm(100.0, 40)
    assert p40 is None
    assert warn40 is not None and "exceeds maximum boundary" in warn40


def test_calculate_set_volume():
    assert calculate_set_volume(100.0, 5, 3) == 1500.0
    assert calculate_set_volume(0.0, 10, 3) == 0.0
    with pytest.raises(ValueError):
        calculate_set_volume(-10.0, 5, 3)


def test_calculate_reps_in_reserve():
    assert calculate_reps_in_reserve(None) is None
    assert calculate_reps_in_reserve(8.0) == 2.0
    assert calculate_reps_in_reserve(8.5) == 1.5
    assert calculate_reps_in_reserve(10.0) == 0.0
    with pytest.raises(ValueError, match="between 1.0 and 10.0"):
        calculate_reps_in_reserve(11.0)
    with pytest.raises(ValueError, match="half-point increments"):
        calculate_reps_in_reserve(8.3)


def test_acwr_zero_chronic_and_insufficient_history():
    today = date(2026, 11, 9)
    # Empty loads -> insufficient_data
    res = calculate_acwr_rolling({}, target_date=today)
    assert res["status"] == "insufficient_data"
    assert res["acwr"] is None

    # Only 5 days history (< 14 days required) -> insufficient_data
    short_history = {today - timedelta(days=i): 1000.0 for i in range(5)}
    res_short = calculate_acwr_rolling(short_history, target_date=today)
    assert res_short["status"] == "insufficient_data"
    assert res_short["days_of_history"] == 5

    # 15 days history but chronic average is 0 -> insufficient_data, never divide by zero
    zero_history = {today - timedelta(days=i): 0.0 for i in range(15)}
    res_zero = calculate_acwr_rolling(zero_history, target_date=today)
    assert res_zero["status"] == "insufficient_data"
    assert res_zero["acwr"] is None
    assert res_zero["chronic_load"] == 0.0


def test_acwr_calculated_zones():
    today = date(2026, 11, 9)
    # Balanced daily loads over 30 days
    loads = {today - timedelta(days=i): 2000.0 for i in range(30)}
    res = calculate_acwr_rolling(loads, target_date=today)
    assert res["status"] == "calculated"
    assert res["acwr"] == 1.0  # Acute avg 2000 / Chronic avg 2000 = 1.0
    assert res["zone"] == "optimal"
    assert isinstance(res["disclaimer"], str) and "NOT validated clinical injury predictors" in res["disclaimer"]

    # Spike in acute load (overreaching)
    loads_spike = dict(loads)
    for i in range(7):
        loads_spike[today - timedelta(days=i)] = 6000.0
    res_spike = calculate_acwr_rolling(loads_spike, target_date=today)
    assert isinstance(res_spike["acwr"], float) and res_spike["acwr"] > 1.5
    assert res_spike["zone"] == "overreaching"


def test_calculate_macro_split():
    # 150g protein (600 kcal), 200g carbs (800 kcal), 60g fat (540 kcal) -> 1940 kcal
    res = calculate_macro_split(150.0, 200.0, 60.0, 1950.0)
    assert res["derived_calories"] == 1940.0
    assert res["discrepancy_flag"] is False  # diff is 10 kcal (< 10%)

    # Large discrepancy (> 10%)
    res_disc = calculate_macro_split(150.0, 200.0, 60.0, 3000.0)
    assert res_disc["discrepancy_flag"] is True
    assert isinstance(res_disc["discrepancy_percentage"], float) and res_disc["discrepancy_percentage"] > 10.0


def test_bmr_mifflin_st_jeor_known_values():
    # Male: 80 kg, 180 cm, 30 years -> 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780.0
    assert bmr(80.0, 180.0, 30, "male") == 1780.0

    # Female: 60 kg, 165 cm, 25 years -> 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25 -> 1345.2
    assert bmr(60.0, 165.0, 25, "female") == 1345.2


def test_bmr_validation_boundaries():
    with pytest.raises(ValueError, match="Weight must be strictly greater than 0"):
        bmr(-5.0, 175.0, 25, "male")
    with pytest.raises(ValueError, match="Height must be between 100 and 250 cm"):
        bmr(70.0, 80.0, 25, "male")
    with pytest.raises(ValueError, match="Height must be between 100 and 250 cm"):
        bmr(70.0, 280.0, 25, "male")
    with pytest.raises(ValueError, match="Age must be between 13 and 100 years"):
        bmr(70.0, 175.0, 10, "male")
    with pytest.raises(ValueError, match="Sex must be 'male' or 'female'"):
        bmr(70.0, 175.0, 25, "other")


def test_tdee_known_factors():
    base_bmr = 1780.0
    assert tdee(base_bmr, "sedentary") == 2136.0
    assert tdee(base_bmr, "light") == 2447.5
    assert tdee(base_bmr, "moderate") == 2759.0
    assert tdee(base_bmr, "very_active") == 3070.5
    assert tdee(base_bmr, "extra_active") == 3382.0

    with pytest.raises(ValueError, match="Invalid activity level"):
        tdee(base_bmr, "olympic_athlete")
    with pytest.raises(ValueError, match="BMR must be strictly greater than 0"):
        tdee(-100.0, "moderate")


def test_daily_target_goals_and_floor():
    base_tdee = 2400.0
    assert daily_target(base_tdee, "maintain")["target_calories"] == 2400
    assert daily_target(base_tdee, "lose")["target_calories"] == 1900
    assert daily_target(base_tdee, "gain")["target_calories"] == 2700

    # Female safe floor check (< 1200 kcal deficit clamped to 1200 with flag)
    res_female = daily_target(1500.0, "lose", sex="female")
    assert res_female["target_calories"] == 1200
    assert res_female["below_floor_flag"] is True
    assert res_female["safe_floor"] == 1200
    assert "below the recommended minimum" in str(res_female["warning"])

    # Male safe floor check (< 1500 kcal deficit clamped to 1500 with flag)
    res_male = daily_target(1800.0, "lose", sex="male")
    assert res_male["target_calories"] == 1500
    assert res_male["below_floor_flag"] is True
    assert res_male["safe_floor"] == 1500
    assert "below the recommended minimum" in str(res_male["warning"])


def test_macro_targets_calculations():
    # 2000 kcal, 75kg, maintain, protein 1.8g/kg
    macros = macro_targets(calories=2000.0, weight_kg=75.0, goal="maintain", protein_g_per_kg=1.8)
    assert macros["protein_g"] == 135.0  # 75 * 1.8
    assert macros["protein_kcal"] == 540.0
    assert macros["fat_kcal"] == 500.0  # 25% of 2000
    assert macros["fat_g"] == 55.6  # 500 / 9
    assert macros["carbs_kcal"] == 960.0  # 2000 - 540 - 500
    assert macros["carbs_g"] == 240.0  # 960 / 4

    # Gain goal: 30% fat
    macros_gain = macro_targets(calories=2500.0, weight_kg=80.0, goal="gain", protein_g_per_kg=2.0)
    assert macros_gain["protein_g"] == 160.0
    assert macros_gain["fat_kcal"] == 750.0  # 30% of 2500

    with pytest.raises(ValueError, match="Calories must be strictly greater than 0"):
        macro_targets(0.0, 75.0)
    with pytest.raises(ValueError, match="Protein per kg must be between 1.6 and 2.2"):
        macro_targets(2000.0, 75.0, protein_g_per_kg=1.2)
