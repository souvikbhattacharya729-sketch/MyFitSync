import math
from datetime import date, timedelta
from typing import Any, Dict, Tuple, Union

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


TARGETS_ESTIMATE_DISCLAIMER = (
    "Disclaimer: Estimated energy expenditure (BMR/TDEE) and macronutrient recommendations "
    "are statistical approximations based on standard population equations. They do not constitute "
    "medical or dietary prescriptions. Consult a licensed dietitian or physician before making significant dietary changes."
)

ACTIVITY_FACTORS: Dict[str, float] = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "very_active": 1.725,
    "extra_active": 1.9,
}


def bmr(weight_kg: float, height_cm: float, age: int, sex: str) -> float:
    """
    Computes Basal Metabolic Rate (BMR) using the Mifflin-St Jeor equation.

    Formula:
        Male:   10 * weight_kg + 6.25 * height_cm - 5 * age + 5
        Female: 10 * weight_kg + 6.25 * height_cm - 5 * age - 161

    Validation:
        - weight_kg > 0
        - height_cm between 100 and 250 cm
        - age between 13 and 100 years
        - sex in ('male', 'female')
    """
    if weight_kg <= 0:
        raise ValueError("Weight must be strictly greater than 0.")
    if not (100.0 <= height_cm <= 250.0):
        raise ValueError("Height must be between 100 and 250 cm.")
    if not (13 <= age <= 100):
        raise ValueError("Age must be between 13 and 100 years.")
    norm_sex = sex.lower().strip()
    if norm_sex not in ("male", "female"):
        raise ValueError("Sex must be 'male' or 'female'.")

    base = (10.0 * weight_kg) + (6.25 * height_cm) - (5.0 * age)
    bmr_val = base + 5.0 if norm_sex == "male" else base - 161.0
    return round(bmr_val, 1)


def tdee(bmr_val: float, activity_level: str) -> float:
    """
    Computes Total Daily Energy Expenditure (TDEE).

    Formula:
        TDEE = BMR * Activity Factor
        Factors:
            - sedentary: 1.2
            - light: 1.375
            - moderate: 1.55
            - very_active: 1.725
            - extra_active: 1.9
    """
    if bmr_val <= 0:
        raise ValueError("BMR must be strictly greater than 0.")
    norm_level = activity_level.lower().strip()
    if norm_level not in ACTIVITY_FACTORS:
        raise ValueError(
            f"Invalid activity level '{activity_level}'. Must be one of: {', '.join(ACTIVITY_FACTORS.keys())}"
        )

    factor = ACTIVITY_FACTORS[norm_level]
    return round(bmr_val * factor, 1)


def daily_target(tdee_val: float, goal: str, sex: str = "female") -> Dict[str, Union[int, float, bool, str, None]]:
    """
    Computes daily caloric target based on goal:
        - lose: subtract 500 kcal
        - gain: add 300 kcal
        - maintain: unchanged

    Floor check:
        Never returns below 1200 kcal (female) or 1500 kcal (male) without flagging it.
    """
    if tdee_val <= 0:
        raise ValueError("TDEE must be strictly greater than 0.")
    norm_goal = goal.lower().strip()
    if norm_goal not in ("lose", "maintain", "gain"):
        raise ValueError("Goal must be 'lose', 'maintain', or 'gain'.")

    norm_sex = sex.lower().strip() if sex else "female"
    safe_floor = 1500 if norm_sex == "male" else 1200

    if norm_goal == "lose":
        raw_target = tdee_val - 500.0
    elif norm_goal == "gain":
        raw_target = tdee_val + 300.0
    else:
        raw_target = tdee_val

    below_floor_flag = False
    warning = None
    target_cals = round(raw_target)

    if target_cals < safe_floor:
        below_floor_flag = True
        target_cals = safe_floor
        warning = (
            f"Calculated deficit ({round(raw_target)} kcal) is below the recommended minimum "
            f"safe floor of {safe_floor} kcal/day for {norm_sex}s. Target has been set to {safe_floor} kcal."
        )

    return {
        "target_calories": int(target_cals),
        "raw_target": round(raw_target, 1),
        "below_floor_flag": below_floor_flag,
        "safe_floor": safe_floor,
        "warning": warning,
    }


def macro_targets(
    calories: float, weight_kg: float, goal: str = "maintain", protein_g_per_kg: float = 1.8
) -> Dict[str, float]:
    """
    Computes macro targets:
        - protein: 1.6 - 2.2 g/kg (default 1.8 g/kg)
        - fat: 25 - 30% of calories (default 25%, 30% for gain)
        - carbs: remainder of calories
        Standard Atwater factors: 4 kcal/g protein, 4 kcal/g carbs, 9 kcal/g fat.
    """
    if calories <= 0:
        raise ValueError("Calories must be strictly greater than 0.")
    if weight_kg <= 0:
        raise ValueError("Weight must be strictly greater than 0.")
    if not (1.6 <= protein_g_per_kg <= 2.2):
        raise ValueError("Protein per kg must be between 1.6 and 2.2 g/kg.")

    # 1. Protein
    protein_g = round(weight_kg * protein_g_per_kg, 1)
    protein_kcal = round(protein_g * 4.0, 1)

    # 2. Fat (25% for maintain/cut, 30% for gain)
    fat_ratio = 0.30 if goal.lower().strip() == "gain" else 0.25
    fat_kcal = round(calories * fat_ratio, 1)
    fat_g = round(fat_kcal / 9.0, 1)

    # 3. Carbs (remainder)
    carbs_kcal = max(0.0, round(calories - protein_kcal - fat_kcal, 1))
    carbs_g = round(carbs_kcal / 4.0, 1)

    total_macro_kcal = protein_kcal + fat_kcal + carbs_kcal
    protein_pct = round((protein_kcal / total_macro_kcal) * 100, 1) if total_macro_kcal > 0 else 0.0
    fat_pct = round((fat_kcal / total_macro_kcal) * 100, 1) if total_macro_kcal > 0 else 0.0
    carbs_pct = round((carbs_kcal / total_macro_kcal) * 100, 1) if total_macro_kcal > 0 else 0.0

    return {
        "protein_g": protein_g,
        "protein_kcal": protein_kcal,
        "protein_pct": protein_pct,
        "fat_g": fat_g,
        "fat_kcal": fat_kcal,
        "fat_pct": fat_pct,
        "carbs_g": carbs_g,
        "carbs_kcal": carbs_kcal,
        "carbs_pct": carbs_pct,
    }


def calculate_user_targets(user: Any) -> Dict[str, Any]:
    """
    Computes BMR, TDEE, daily target calories, and macro targets for a user.
    Reused across /targets endpoint and AI Coach context generation.
    """
    missing_fields = []
    if not getattr(user, "bodyweight_kg", None) or user.bodyweight_kg <= 0:
        missing_fields.append("bodyweight_kg")
    if not getattr(user, "height_cm", None):
        missing_fields.append("height_cm")
    if not getattr(user, "age", None):
        missing_fields.append("age")
    if not getattr(user, "sex", None):
        missing_fields.append("sex")
    if not getattr(user, "activity_level", None):
        missing_fields.append("activity_level")
    if not getattr(user, "goal", None):
        missing_fields.append("goal")

    if missing_fields:
        return {
            "profile_complete": False,
            "missing_fields": missing_fields,
            "disclaimer": TARGETS_ESTIMATE_DISCLAIMER,
            "hide_calorie_targets": getattr(user, "hide_calorie_targets", False),
        }

    user_bmr = bmr(
        weight_kg=float(user.bodyweight_kg),
        height_cm=float(user.height_cm),
        age=int(user.age),
        sex=str(user.sex),
    )
    user_tdee = tdee(user_bmr, str(user.activity_level))
    target_res = daily_target(user_tdee, str(user.goal), str(user.sex))
    cal_target = int(target_res["target_calories"])

    macros_dict = macro_targets(
        calories=float(cal_target),
        weight_kg=float(user.bodyweight_kg),
        goal=str(user.goal),
    )

    return {
        "profile_complete": True,
        "missing_fields": [],
        "bmr": user_bmr,
        "tdee": user_tdee,
        "calorie_target": cal_target,
        "raw_target_calories": float(target_res["raw_target"]),
        "safe_floor_applied": bool(target_res["below_floor_flag"]),
        "safe_floor_kcal": int(target_res["safe_floor"]),
        "floor_warning": str(target_res["warning"]) if target_res["warning"] else None,
        "macros": macros_dict,
        "disclaimer": TARGETS_ESTIMATE_DISCLAIMER,
        "hide_calorie_targets": getattr(user, "hide_calorie_targets", False),
    }
