from datetime import date, datetime
from typing import Any, Dict, List, Tuple
from zoneinfo import ZoneInfo

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.sports_science import (
    calculate_acwr_rolling,
    calculate_macro_split,
)
from app.models.nutrition import Nutrition
from app.models.readiness import DailyReadiness
from app.models.user import User
from app.models.workout import Workout

KEY_LIFTS = ["squat", "bench_press", "deadlift", "overhead_press"]


class AnalyticsService:
    @staticmethod
    def get_latest_e1rm_by_exercise(db: Session, user_id: str) -> Dict[str, float | None]:
        result: Dict[str, float | None] = {lift: None for lift in KEY_LIFTS}

        # Query max estimated_1rm or most recent estimated_1rm for each key lift
        for lift in KEY_LIFTS:
            latest = (
                db.query(Workout)
                .filter(
                    Workout.user_id == user_id,
                    Workout.exercise == lift,
                    Workout.estimated_1rm.isnot(None),
                )
                .order_by(Workout.performed_on.desc(), Workout.id.desc())
                .first()
            )
            if latest and latest.estimated_1rm is not None:
                result[lift] = round(latest.estimated_1rm, 1)
        return result

    @staticmethod
    def get_daily_training_loads(db: Session, user_id: str) -> Dict[date, float]:
        rows = (
            db.query(Workout.performed_on, func.sum(Workout.total_volume))
            .filter(Workout.user_id == user_id)
            .group_by(Workout.performed_on)
            .all()
        )
        return {r[0]: float(r[1] or 0.0) for r in rows}

    @staticmethod
    def compute_acwr_for_user(db: Session, user_id: str, target_date: date | None = None) -> Dict[str, Any]:
        if target_date is None:
            user = db.query(User).filter(User.user_id == user_id).first()
            tz_str = user.timezone if user else "UTC"
            try:
                tz = ZoneInfo(tz_str)
            except Exception:
                tz = ZoneInfo("UTC")
            target_date = datetime.now(tz).date()

        daily_loads = AnalyticsService.get_daily_training_loads(db, user_id)
        return calculate_acwr_rolling(daily_loads, target_date=target_date)

    @staticmethod
    def get_today_nutrition(db: Session, user: User, target_date: date | None = None) -> Dict[str, Any]:
        if target_date is None:
            try:
                tz = ZoneInfo(user.timezone)
            except Exception:
                tz = ZoneInfo("UTC")
            target_date = datetime.now(tz).date()

        entries = db.query(Nutrition).filter(Nutrition.user_id == user.user_id, Nutrition.eaten_on == target_date).all()

        cal_sum = sum(e.calories or 0.0 for e in entries)
        pro_sum = sum(e.protein_g or 0.0 for e in entries)
        carb_sum = sum(e.carbs_g or 0.0 for e in entries)
        fat_sum = sum(e.fat_g or 0.0 for e in entries)

        cal_pct = round((cal_sum / user.target_calories) * 100, 1) if user.target_calories > 0 else 0.0
        pro_pct = (
            round((pro_sum / user.target_protein_g) * 100, 1)
            if user.target_protein_g and user.target_protein_g > 0
            else None
        )

        macro_split = calculate_macro_split(pro_sum, carb_sum, fat_sum, cal_sum)

        return {
            "date": target_date,
            "calories": round(cal_sum, 1),
            "protein_g": round(pro_sum, 1),
            "carbs_g": round(carb_sum, 1),
            "fat_g": round(fat_sum, 1),
            "target_calories": user.target_calories,
            "target_protein_g": user.target_protein_g,
            "calories_pct": cal_pct,
            "protein_pct": pro_pct,
            "macro_split": macro_split,
        }

    @staticmethod
    def get_last_readiness(db: Session, user_id: str) -> Dict[str, Any]:
        last = (
            db.query(DailyReadiness)
            .filter(DailyReadiness.user_id == user_id)
            .order_by(DailyReadiness.logged_date.desc(), DailyReadiness.id.desc())
            .first()
        )
        if not last:
            return {
                "logged_date": None,
                "sleep_hours": None,
                "soreness_score": None,
                "resting_hr": None,
            }
        return {
            "logged_date": last.logged_date,
            "sleep_hours": last.sleep_hours,
            "soreness_score": last.soreness_score,
            "resting_hr": last.resting_hr,
        }

    @staticmethod
    def get_volume_analytics(db: Session, user_id: str, group_by: str = "daily") -> List[Dict[str, Any]]:
        workouts = db.query(Workout).filter(Workout.user_id == user_id).order_by(Workout.performed_on.asc()).all()
        if group_by == "weekly":
            # Group by ISO week (year, week)
            weekly_map: Dict[Tuple[int, int], float] = {}
            for w in workouts:
                iso_yr, iso_wk, _ = w.performed_on.isocalendar()
                key = (iso_yr, iso_wk)
                weekly_map[key] = weekly_map.get(key, 0.0) + w.total_volume
            return [
                {
                    "year": k[0],
                    "week": k[1],
                    "label": f"{k[0]}-W{k[1]:02d}",
                    "volume_kg": round(v, 1),
                }
                for k, v in sorted(weekly_map.items())
            ]
        else:
            daily_map: Dict[date, float] = {}
            for w in workouts:
                daily_map[w.performed_on] = daily_map.get(w.performed_on, 0.0) + w.total_volume
            return [{"date": str(k), "volume_kg": round(v, 1)} for k, v in sorted(daily_map.items())]

    @staticmethod
    def get_strength_trends(db: Session, user_id: str, exercise: str | None = None) -> List[Dict[str, Any]]:
        query = db.query(Workout).filter(Workout.user_id == user_id, Workout.estimated_1rm.isnot(None))
        if exercise:
            query = query.filter(Workout.exercise == exercise)
        workouts = query.order_by(Workout.performed_on.asc(), Workout.id.asc()).all()
        return [
            {
                "id": w.id,
                "date": str(w.performed_on),
                "exercise": w.exercise,
                "weight_kg": w.weight_kg,
                "reps": w.reps,
                "sets": w.sets,
                "rpe": w.rpe,
                "estimated_1rm": w.estimated_1rm,
            }
            for w in workouts
        ]
