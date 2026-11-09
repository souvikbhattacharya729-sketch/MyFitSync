import math
from datetime import date, timedelta
from typing import Dict, Tuple, Union

ACWR_DISCLAIMER = (
    "Disclaimer: Acute:Chronic Workload Ratio (ACWR) and related metrics are descriptive "
    "training indicators only and are NOT validated clinical injury predictors or medical diagnoses."
)

RECOVERY_DISCLAIMER = (
    "Disclaimer: Readiness, recovery scores, and sleep indicators are purely informational "
    "lifestyle estimates and should never replace professional medical or diagnostic evaluation."
)


def calculate_brzycki_1rm(weight_kg: float, reps: int) -> float:
    """
    Computes Estimated 1-Rep Max (E1RM) using the Brzycki formula.

    Formula:
        E1RM = weight_kg * (36 / (37 - reps))

    Valid Range:
        - reps: 1 to 10 (scientific validity degrades significantly above 10 reps)
        - weight_kg: >= 0

    Limitations:
        - Strictly invalid for reps >= 37 (results in division by zero or negative 1RM).
        - Underestimates/overestimates at very high repetitions.
    """
    if reps <= 0:
        raise ValueError("Reps must be strictly greater than 0.")
    if reps >= 37:
        raise ValueError("Brzycki formula is invalid for reps >= 37 (division by zero or negative value).")
    if weight_kg < 0:
        raise ValueError("Weight must be non-negative.")
    if reps == 1:
        return round(float(weight_kg), 2)

    e1rm = weight_kg * (36.0 / (37.0 - reps))
    return round(float(e1rm), 2)


def calculate_wathan_1rm(weight_kg: float, reps: int) -> float:
    """
    Computes Estimated 1-Rep Max (E1RM) using the Wathan formula.

    Formula:
        E1RM = (100 * weight_kg) / (48.8 + 53.8 * exp(-0.075 * reps))

    Valid Range:
        - reps: 1 to 10
        - weight_kg: >= 0

    Limitations:
        - Accuracy degrades above 10-12 repetitions.
    """
    if reps <= 0:
        raise ValueError("Reps must be strictly greater than 0.")
    if weight_kg < 0:
        raise ValueError("Weight must be non-negative.")
    if reps == 1:
        return round(float(weight_kg), 2)

    denominator = 48.8 + 53.8 * math.exp(-0.075 * reps)
    e1rm = (100.0 * weight_kg) / denominator
    return round(float(e1rm), 2)


def compute_estimated_1rm(weight_kg: float, reps: int) -> Tuple[float | None, float | None, str | None]:
    """
    Evaluates E1RM for storage and analytics.

    Returns:
        (primary_e1rm, secondary_wathan_e1rm, warning_message)

    Rules:
        - Uses Brzycki as primary E1RM when reps <= 10.
        - Provides Wathan as secondary value.
        - If reps between 11 and 12, computes Brzycki but returns a cautionary warning.
        - If reps > 12, returns None for primary storage with a formal validity warning.
    """
    if reps <= 0 or weight_kg <= 0:
        return None, None, None
    if reps >= 37:
        return None, None, "Reps >= 37 exceeds maximum boundary for 1RM estimation."

    if reps > 12:
        return None, None, f"1RM not calculated: {reps} reps exceeds valid estimation boundary (max 12 reps)."

    primary = calculate_brzycki_1rm(weight_kg, reps)
    wathan = calculate_wathan_1rm(weight_kg, reps)

    warning = None
    if reps > 10:
        warning = f"Notice: 1RM accuracy declines when reps ({reps}) exceed 10."

    return primary, wathan, warning


def calculate_set_volume(weight_kg: float, reps: int, sets: int) -> float:
    """Computes total training volume: weight_kg * reps * sets."""
    if weight_kg < 0 or reps < 0 or sets < 0:
        raise ValueError("Weight, reps, and sets must be non-negative.")
    return round(float(weight_kg * reps * sets), 2)


def calculate_reps_in_reserve(rpe: float | None) -> float | None:
    """
    Calculates Reps In Reserve (RIR) based on RPE:
        RIR = 10 - RPE
    Only computed when RPE is explicitly provided.
    """
    if rpe is None:
        return None
    if not (1.0 <= rpe <= 10.0):
        raise ValueError("RPE must be between 1.0 and 10.0.")
    # Check half-point step
    if round(rpe * 2) != rpe * 2:
        raise ValueError("RPE must be in half-point increments (e.g., 7.5, 8.0).")
    return round(10.0 - rpe, 1)


def calculate_acwr_rolling(
    daily_loads: Dict[date, float],
    target_date: date,
    acute_days: int = 7,
    chronic_days: int = 28,
    min_history_days: int = 14,
) -> Dict[str, Union[float, str, None]]:
    """
    Calculates rolling-average Acute:Chronic Workload Ratio (ACWR).

    Method:
        - Acute window: past 7 days average daily load.
        - Chronic window: past 28 days average daily load.
        - ACWR = Acute Daily Average / Chronic Daily Average.

    Edge Cases:
        - If chronic load is 0 -> returns status 'insufficient_data' (never divide by zero, never infinity).
        - If days of recorded history < min_history_days (14) -> returns status 'insufficient_data'.

    Zones (Descriptive only, not clinical):
        - < 0.8: 'underreaching'
        - 0.8 - 1.3: 'optimal'
        - 1.3 - 1.5: 'high_risk'
        - > 1.5: 'overreaching'
    """
    if not daily_loads:
        return {
            "acwr": None,
            "acute_load": 0.0,
            "chronic_load": 0.0,
            "status": "insufficient_data",
            "zone": "insufficient_data",
            "days_of_history": 0,
            "disclaimer": ACWR_DISCLAIMER,
        }

    sorted_dates = sorted(daily_loads.keys())
    earliest_date = sorted_dates[0]
    days_of_history = (target_date - earliest_date).days + 1

    # Check minimum history requirement
    if days_of_history < min_history_days:
        return {
            "acwr": None,
            "acute_load": 0.0,
            "chronic_load": 0.0,
            "status": "insufficient_data",
            "zone": "insufficient_data",
            "days_of_history": days_of_history,
            "disclaimer": ACWR_DISCLAIMER,
        }

    # Acute window calculation (past acute_days ending at target_date)
    acute_sum = sum(daily_loads.get(target_date - timedelta(days=i), 0.0) for i in range(acute_days))
    acute_avg = acute_sum / acute_days

    # Chronic window calculation (past chronic_days ending at target_date)
    chronic_sum = sum(daily_loads.get(target_date - timedelta(days=i), 0.0) for i in range(chronic_days))
    chronic_avg = chronic_sum / chronic_days

    # Guard against zero division
    if chronic_avg <= 0.0:
        return {
            "acwr": None,
            "acute_load": round(acute_avg, 2),
            "chronic_load": round(chronic_avg, 2),
            "status": "insufficient_data",
            "zone": "insufficient_data",
            "days_of_history": days_of_history,
            "disclaimer": ACWR_DISCLAIMER,
        }

    acwr_value = round(acute_avg / chronic_avg, 2)

    # Classify descriptive zone
    if acwr_value < 0.8:
        zone = "underreaching"
    elif acwr_value <= 1.3:
        zone = "optimal"
    elif acwr_value <= 1.5:
        zone = "high_risk"
    else:
        zone = "overreaching"

    return {
        "acwr": acwr_value,
        "acute_load": round(acute_avg, 2),
        "chronic_load": round(chronic_avg, 2),
        "status": "calculated",
        "zone": zone,
        "days_of_history": days_of_history,
        "disclaimer": ACWR_DISCLAIMER,
    }


def calculate_macro_split(
    protein_g: float | None, carbs_g: float | None, fat_g: float | None, logged_calories: float | None
) -> Dict[str, Union[float, bool, None, str]]:
    """
    Computes macronutrient caloric breakdown (4 kcal/g protein, 4 kcal/g carbs, 9 kcal/g fat).
    Flags discrepancies greater than 10% between logged calories and macro-derived calories.
    """
    p = protein_g or 0.0
    c = carbs_g or 0.0
    f = fat_g or 0.0

    derived_calories = round((p * 4.0) + (c * 4.0) + (f * 9.0), 1)

    discrepancy_flag = False
    discrepancy_pct = None

    if logged_calories is not None and logged_calories > 0 and derived_calories > 0:
        diff = abs(logged_calories - derived_calories)
        discrepancy_pct = round((diff / logged_calories) * 100, 1)
        if discrepancy_pct > 10.0:
            discrepancy_flag = True

    return {
        "derived_calories": derived_calories,
        "logged_calories": logged_calories,
        "protein_calories": round(p * 4.0, 1),
        "carbs_calories": round(c * 4.0, 1),
        "fat_calories": round(f * 9.0, 1),
        "discrepancy_flag": discrepancy_flag,
        "discrepancy_percentage": discrepancy_pct,
        "note": "Caloric breakdown uses standard Atwater factors (4/4/9 kcal/g).",
    }
