from datetime import date
from typing import Dict, List

from sqlalchemy.orm import Session

from app.core.sports_science import calculate_set_volume, compute_estimated_1rm
from app.models.nutrition import Nutrition
from app.models.readiness import DailyReadiness
from app.models.user import User
from app.models.workout import Workout
from app.schemas.chat import ChatResponse, ClarificationItem, SavedRecords
from app.schemas.nutrition import NutritionOut
from app.schemas.readiness import ReadinessOut
from app.schemas.workout import WorkoutOut
from app.services.nlp_parser import DeterministicNLPParser, ParseResult


class ChatService:
    def __init__(self, parser: DeterministicNLPParser | None = None):
        self.parser = parser or DeterministicNLPParser()

    def process_chat_message(self, db: Session, user: User, message: str, timezone: str | None = None) -> ChatResponse:
        user_tz = timezone or user.timezone or "UTC"
        parse_result: ParseResult = self.parser.parse(message, user_timezone=user_tz)

        saved_workouts: List[Workout] = []
        saved_nutrition: List[Nutrition] = []
        saved_readiness: List[DailyReadiness] = []
        warnings: List[str] = list(parse_result.warnings)

        # 1. Process Workout Records
        session_volume = 0.0
        best_e1rm: Dict[str, float] = {}

        for pw in parse_result.workouts:
            primary_e1rm, _, e1rm_warning = compute_estimated_1rm(pw.weight_kg, pw.reps)
            if e1rm_warning:
                warnings.append(e1rm_warning)

            volume = calculate_set_volume(pw.weight_kg, pw.reps, pw.sets)
            session_volume += volume

            if primary_e1rm:
                cur_best = best_e1rm.get(pw.exercise, 0.0)
                if primary_e1rm > cur_best:
                    best_e1rm[pw.exercise] = primary_e1rm

            workout_record = Workout(
                user_id=user.user_id,
                exercise=pw.exercise,
                exercise_raw=pw.exercise_raw,
                weight_kg=pw.weight_kg,
                reps=pw.reps,
                sets=pw.sets,
                rpe=pw.rpe,
                estimated_1rm=primary_e1rm,
                total_volume=volume,
                performed_on=pw.performed_on or date.today(),
            )
            db.add(workout_record)
            saved_workouts.append(workout_record)

        # 2. Process Nutrition Records
        for pn in parse_result.nutrition:
            nutr_record = Nutrition(
                user_id=user.user_id,
                meal_title=pn.meal_title,
                calories=pn.calories,
                protein_g=pn.protein_g,
                carbs_g=pn.carbs_g,
                fat_g=pn.fat_g,
                eaten_on=pn.eaten_on or date.today(),
            )
            db.add(nutr_record)
            saved_nutrition.append(nutr_record)

        # 3. Process Daily Readiness Records (Merge/Update if entry exists for this date)
        for pr in parse_result.readiness:
            target_date = pr.logged_date or date.today()
            existing = (
                db.query(DailyReadiness)
                .filter(DailyReadiness.user_id == user.user_id, DailyReadiness.logged_date == target_date)
                .first()
            )
            if existing:
                # Merge only non-null fields
                if pr.sleep_hours is not None:
                    existing.sleep_hours = pr.sleep_hours
                if pr.soreness_score is not None:
                    existing.soreness_score = pr.soreness_score
                if pr.resting_hr is not None:
                    existing.resting_hr = pr.resting_hr
                saved_readiness.append(existing)
            else:
                readiness_record = DailyReadiness(
                    user_id=user.user_id,
                    sleep_hours=pr.sleep_hours,
                    soreness_score=pr.soreness_score,
                    resting_hr=pr.resting_hr,
                    logged_date=target_date,
                )
                db.add(readiness_record)
                saved_readiness.append(readiness_record)

        # Flush database changes so IDs and timestamps are assigned
        db.flush()

        # Build response reply text
        saved_parts = []
        if saved_workouts:
            count = len(saved_workouts)
            saved_parts.append(f"{count} workout{'s' if count > 1 else ''}")
        if saved_nutrition:
            count = len(saved_nutrition)
            saved_parts.append(f"{count} nutrition entr{'ies' if count > 1 else 'y'}")
        if saved_readiness:
            count = len(saved_readiness)
            saved_parts.append(f"{count} recovery entr{'ies' if count > 1 else 'y'}")

        if saved_parts:
            reply_text = f"Logged {', '.join(saved_parts)}."
        else:
            reply_text = "I received your message."

        clarification_items = [
            ClarificationItem(field=c.field, exercise=c.exercise, question=c.question)
            for c in parse_result.clarifications
        ]

        if clarification_items:
            questions_text = " ".join(c.question for c in clarification_items)
            reply_text = f"{reply_text} {questions_text}".strip()

        return ChatResponse(
            reply=reply_text,
            saved=SavedRecords(
                workouts=[WorkoutOut.model_validate(w) for w in saved_workouts],
                nutrition=[NutritionOut.model_validate(n) for n in saved_nutrition],
                readiness=[ReadinessOut.model_validate(r) for r in saved_readiness],
            ),
            clarifications=clarification_items,
            warnings=warnings,
            metrics={"session_volume_kg": round(session_volume, 1), "best_e1rm": best_e1rm},
        )
