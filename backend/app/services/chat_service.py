import re
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
from app.services.coach_service import coach_reply
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

        # Check if user message has conversational or advisory intent
        lower_msg = message.lower()
        conversational_triggers = [
            "give me",
            "suggest",
            "recommend",
            "what",
            "how",
            "why",
            "who",
            "tell me",
            "can you",
            "should i",
            "routine",
            "split",
            "plan",
            "diet",
            "advice",
            "help",
            "hello",
            "hi",
            "hey",
        ]
        is_conversational = any(t in lower_msg for t in conversational_triggers)

        if saved_parts:
            reply_text = f"Logged {', '.join(saved_parts)}."
            clarification_items = [
                ClarificationItem(field=c.field, exercise=c.exercise, question=c.question)
                for c in parse_result.clarifications
            ]
            if clarification_items:
                questions_text = " ".join(c.question for c in clarification_items)
                reply_text = f"{reply_text} Note: {questions_text}".strip()
        elif is_conversational:
            coach_text = coach_reply(db, user, message)
            reply_text = coach_text if coach_text is not None else self.generate_ai_conversational_reply(message, user)
            clarification_items = []
        elif parse_result.clarifications:
            reply_text = "I parsed your statement, but I need a quick clarification:"
            clarification_items = [
                ClarificationItem(field=c.field, exercise=c.exercise, question=c.question)
                for c in parse_result.clarifications
            ]
            questions_text = " ".join(c.question for c in clarification_items)
            reply_text = f"{reply_text} {questions_text}".strip()
        else:
            coach_text = coach_reply(db, user, message)
            reply_text = coach_text if coach_text is not None else self.generate_ai_conversational_reply(message, user)
            clarification_items = []

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

    def generate_ai_conversational_reply(self, message: str, user: User) -> str:
        """
        Conversational Fitness Coach AI engine (like Grok for fitness intelligence).
        Answers diet, calorie, workout, and recovery queries intelligently with actionable advice.
        """
        msg = message.lower().strip()
        user_name = user.name or "Athlete"

        # 1. Greetings / Help
        tokens = set(re.findall(r"\b[a-z]+\b", msg))
        greeting_words = {"hi", "hello", "hey", "greetings", "sup", "help"}
        if (greeting_words & tokens) or any(
            phrase in msg for phrase in ["good morning", "good evening", "who are you", "what can you do"]
        ):
            return (
                f"Hello {user_name}! I am your MyFitSync AI Coach. "
                "I can answer training and nutrition questions or automatically log your workouts, meals, and recovery. "
                "Try asking me for advice (e.g., 'high protein food list', 'how to increase bench press') "
                "or log directly in plain English (e.g., 'Squats 100kg 5 reps 3 sets, ate 2 boiled eggs')."
            )

        # 2. Food & Calorie Lookups
        if any(
            w in msg
            for w in [
                "egg",
                "eggs",
                "protein in",
                "calories in",
                "how many calories",
                "macro",
                "macros",
                "nutrition for",
            ]
        ):
            if "egg" in msg:
                return (
                    "🥚 Boiled Egg Nutrition (per large egg ~50g):\n"
                    "• Calories: 78 kcal\n"
                    "• Protein: 6.3 g (High biological value)\n"
                    "• Carbs: 0.6 g\n"
                    "• Fat: 5.3 g (Healthy monounsaturated & polyunsaturated fats)\n\n"
                    "Pro-Tip: Egg whites alone contain ~17 kcal and 3.6g protein with near-zero fat. You can log it anytime: 'Ate 3 boiled eggs'."
                )
            if "chicken" in msg:
                return (
                    "🍗 Cooked Chicken Breast (per 100g):\n"
                    "• Calories: 165 kcal\n"
                    "• Protein: 31.0 g\n"
                    "• Carbs: 0.0 g\n"
                    "• Fat: 3.6 g\n\n"
                    "Pro-Tip: Ideal lean protein source for muscle protein synthesis. Log with: 'Ate 200g chicken breast'."
                )
            if "rice" in msg:
                return (
                    "🍚 Cooked White Rice (per 100g):\n"
                    "• Calories: 130 kcal\n"
                    "• Protein: 2.7 g\n"
                    "• Carbs: 28.0 g\n"
                    "• Fat: 0.3 g\n\n"
                    "Pro-Tip: Fast-digesting carbohydrates great for post-workout glycogen replenishment."
                )

        # 3. Diet, Macro Split & Calorie Advice
        if any(
            w in msg
            for w in [
                "diet",
                "meal plan",
                "what to eat",
                "what should i eat",
                "high protein",
                "nutrition advice",
                "protein target",
                "bulking",
                "cutting",
            ]
        ):
            bw = user.bodyweight_kg or 75.0
            target_p = round(bw * 2.0, 1)
            target_cals = user.target_calories or 2500
            return (
                f"🥗 Personalized Nutrition Strategy for {user_name} ({bw} kg):\n"
                f"• Daily Calorie Target: ~{target_cals} kcal/day\n"
                f"• Optimal Protein Goal: ~{target_p} g/day (2.0g/kg bodyweight for maximum muscle protein synthesis)\n"
                "• High-Protein Staples: Chicken breast, eggs/egg whites, whey protein, Greek yogurt, paneer, tofu, salmon\n"
                "• Complex Carbohydrates: Rolled oats, jasmine rice, sweet potatoes, whole wheat roti/bread\n"
                "• Healthy Fats: Avocado, almonds, peanut butter, extra virgin olive oil\n\n"
                "Would you like meal recommendations for pre-workout energy or post-workout recovery?"
            )

        # 4. Workout Advice & Progressive Overload
        if any(
            w in msg
            for w in [
                "workout",
                "routine",
                "split",
                "exercise",
                "bench",
                "squat",
                "deadlift",
                "hypertrophy",
                "progressive overload",
                "training",
            ]
        ):
            return (
                "🏋️‍♂️ Evidence-Based Workout Programming Principles:\n"
                "• Hypertrophy Volume: 10–20 hard sets per muscle group per week.\n"
                "• Intensity & Proximity to Failure: Train mostly between RPE 7.5 and RPE 9.0 (1–2 reps in reserve).\n"
                "• 1RM Brzycki Formulation: Estimated 1RM = Weight × (36 / (37 - Reps)).\n"
                "• Proven Split Options: Push / Pull / Legs (3–6 days) or Upper / Lower (4 days).\n\n"
                "Tell me your current goal (strength, hypertrophy, or fat loss) to tailor a routine!"
            )

        # 5. Recovery & Fatigue / Sleep / ACWR
        if any(w in msg for w in ["sleep", "recovery", "sore", "soreness", "fatigue", "acwr", "tired", "rest"]):
            return (
                f"💤 Recovery & ACWR Directive for {user_name}:\n"
                "• Sleep Duration: 7.5–9.0 hours per night for hormone optimization and central nervous system repair.\n"
                "• Acute:Chronic Workload Ratio (ACWR): Keep your 7-day acute volume between 0.8 and 1.3 of your 28-day chronic volume to minimize injury risk.\n"
                "• Active Recovery: When soreness is elevated, light walking, mobility drills, and adequate protein intake accelerate recovery much faster than complete bed rest."
            )

        # 6. Fallback Intelligent Guidance
        return (
            f"I hear you, {user_name}! I am your personal fitness intelligence assistant. "
            "You can ask me questions about calories, macros, and workout splits, "
            "or log your sets and meals directly (e.g. 'Squats 100 kg 5 reps 3 sets, ate 2 boiled eggs')."
        )
