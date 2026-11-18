import logging
import os
import re
from datetime import date, timedelta
from typing import Any, List, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.sports_science import calculate_user_targets
from app.models.coach import CoachUsage
from app.models.nutrition import Nutrition
from app.models.readiness import DailyReadiness
from app.models.user import User
from app.models.workout import Workout

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are MyFitSync's AI coach for healthy adults. You answer training, strength, nutrition, "
    "recovery, sleep, and general fitness and wellness education. Use the athlete's data when relevant "
    "and state clearly when data is missing. Never invent workouts, meals, or numbers that aren't in the data, "
    "and always label numbers as estimates.\n\n"
    "You are not a doctor: for injuries, pain, symptoms, medication, pregnancy, or medical conditions, "
    "state that you cannot diagnose and recommend consulting a qualified professional.\n\n"
    "Decline unrelated topics in one sentence and offer fitness or nutrition help instead.\n\n"
    "If the athlete describes restricting food, purging, bingeing, or compensating for eating, "
    "give no calorie targets, meal plans, fasting advice, or weight-loss numbers. Respond warmly "
    "and encourage talking to a doctor or registered dietitian.\n\n"
    "If the athlete mentions self-harm or suicide, respond with care and point to emergency services "
    "or a crisis line.\n\n"
    "Never shame, praise restriction, or use streak or red-warning language."
)

CRISIS_WORDS: Tuple[str, ...] = (
    "suicide",
    "kill myself",
    "end my life",
    "want to die",
    "wanting to die",
    "self-harm",
    "self harm",
    "cutting myself",
    "cut myself",
    "hurt myself",
    "hurting myself",
    "harm myself",
    "harming myself",
    "hang myself",
    "hanging myself",
    "overdose",
    "overdosing",
)

RESTRICTION_WORDS: Tuple[str, ...] = (
    "purge",
    "purging",
    "binge",
    "bingeing",
    "starve",
    "starving",
    "starve myself",
    "restrict food",
    "restricting",
    "skip meals",
    "skip all meals",
    "vomit after eating",
    "throw up after eating",
    "compensate for eating",
    "compensating for food",
    "anorexia",
    "bulimia",
    "laxative",
    "punish myself with exercise",
)

COACH_DISCLAIMER = (
    "General guidance and estimates, not medical advice. "
    "For injuries, symptoms, or medical conditions, see a qualified professional."
)

_client: Any | None = None


def _mentions(text: str, words: Tuple[str, ...]) -> bool:
    if not text:
        return False
    lower_text = text.lower()
    for word in words:
        pattern = r"\b" + re.escape(word.lower()) + r"\b"
        if re.search(pattern, lower_text):
            return True
    return False


def is_crisis(text: str) -> bool:
    return _mentions(text, CRISIS_WORDS)


def crisis_reply() -> str:
    custom_msg = os.getenv("COACH_CRISIS_MESSAGE") or getattr(settings, "COACH_CRISIS_MESSAGE", None)
    if custom_msg and str(custom_msg).strip():
        return str(custom_msg).strip()
    return (
        "It sounds like you are going through a difficult time. Please know that support is available. "
        "If you are in distress or thinking about self-harm, please reach out immediately to someone you trust, "
        "a healthcare professional, or your local emergency services or crisis line. You do not have to carry this alone."
    )


def get_client() -> Any:
    global _client
    api_key = os.getenv("GROQ_API_KEY") or getattr(settings, "GROQ_API_KEY", None)
    if not api_key or not str(api_key).strip():
        raise RuntimeError("GROQ_API_KEY is missing or empty.")
    import groq

    if _client is None:
        _client = groq.Groq(api_key=str(api_key).strip(), timeout=20.0, max_retries=2)
    return _client


def build_context(db: Session, user: User, include_targets: bool = True) -> str:
    """
    Loads the last 14 days for this user only, up to 50 rows per table, newest first,
    formatted as plain text lines.
    If user.hide_calorie_targets is true, or include_targets is false,
    writes 'Targets: withheld' instead of numbers.
    """
    cutoff_date = date.today() - timedelta(days=14)

    # 1. Targets
    target_lines: List[str] = []
    if getattr(user, "hide_calorie_targets", False) or not include_targets:
        target_lines.append("Targets: withheld")
    else:
        calc = calculate_user_targets(user)
        if calc["profile_complete"]:
            m = calc["macros"]
            target_lines.append(
                f"Targets (estimates): BMR: {calc['bmr']} kcal, TDEE: {calc['tdee']} kcal, "
                f"Daily Target: {calc['calorie_target']} kcal (Protein: {m['protein_g']}g, Carbs: {m['carbs_g']}g, Fat: {m['fat_g']}g)"
            )
        else:
            missing_str = ", ".join(calc["missing_fields"])
            target_lines.append(f"Targets: Profile incomplete (missing: {missing_str})")

    # 2. Workouts (last 14 days, max 50, newest first)
    workouts = (
        db.query(Workout)
        .filter(Workout.user_id == user.user_id, Workout.performed_on >= cutoff_date)
        .order_by(Workout.performed_on.desc(), Workout.id.desc())
        .limit(50)
        .all()
    )
    workout_lines: List[str] = []
    if workouts:
        for w in workouts:
            rpe_str = f" @ RPE {w.rpe}" if w.rpe is not None else ""
            e1rm_str = f", Est 1RM: {w.estimated_1rm} kg" if w.estimated_1rm is not None else ""
            workout_lines.append(
                f"- {w.performed_on}: {w.exercise} ({w.weight_kg} kg x {w.reps} reps x {w.sets} sets{rpe_str}{e1rm_str}, Volume: {w.total_volume} kg)"
            )
    else:
        workout_lines.append("None logged in the last 14 days.")

    # 3. Nutrition (last 14 days, max 50, newest first)
    nutrition_entries = (
        db.query(Nutrition)
        .filter(Nutrition.user_id == user.user_id, Nutrition.eaten_on >= cutoff_date)
        .order_by(Nutrition.eaten_on.desc(), Nutrition.id.desc())
        .limit(50)
        .all()
    )
    nutrition_lines: List[str] = []
    if nutrition_entries:
        for n in nutrition_entries:
            cal_str = f"{n.calories} kcal" if n.calories is not None else "N/A kcal"
            p_str = f"{n.protein_g}g P" if n.protein_g is not None else ""
            c_str = f"{n.carbs_g}g C" if n.carbs_g is not None else ""
            f_str = f"{n.fat_g}g F" if n.fat_g is not None else ""
            macros = ", ".join(filter(None, [p_str, c_str, f_str]))
            macros_part = f" ({macros})" if macros else ""
            title = n.meal_title or "Meal"
            nutrition_lines.append(f"- {n.eaten_on}: {title} - {cal_str}{macros_part}")
    else:
        nutrition_lines.append("None logged in the last 14 days.")

    # 4. Readiness (last 14 days, max 50, newest first)
    readiness_entries = (
        db.query(DailyReadiness)
        .filter(DailyReadiness.user_id == user.user_id, DailyReadiness.logged_date >= cutoff_date)
        .order_by(DailyReadiness.logged_date.desc(), DailyReadiness.id.desc())
        .limit(50)
        .all()
    )
    readiness_lines: List[str] = []
    if readiness_entries:
        for r in readiness_entries:
            parts = []
            if r.sleep_hours is not None:
                parts.append(f"Sleep: {r.sleep_hours} hrs")
            if r.soreness_score is not None:
                parts.append(f"Soreness: {r.soreness_score}/10")
            if r.resting_hr is not None:
                parts.append(f"RHR: {r.resting_hr} bpm")
            readiness_lines.append(f"- {r.logged_date}: {', '.join(parts) if parts else 'Logged'}")
    else:
        readiness_lines.append("None logged in the last 14 days.")

    lines = [
        f"Athlete: {user.name or 'Athlete'}",
        f"Bodyweight: {user.bodyweight_kg} kg" if user.bodyweight_kg else "Bodyweight: Not specified",
        f"Goal: {user.goal}" if user.goal else "Goal: Not specified",
        f"Activity Level: {user.activity_level}" if user.activity_level else "Activity Level: Not specified",
        "\n".join(target_lines),
        "\nWorkouts (last 14 days):",
        "\n".join(workout_lines),
        "\nNutrition (last 14 days):",
        "\n".join(nutrition_lines),
        "\nRecovery & Readiness (last 14 days):",
        "\n".join(readiness_lines),
    ]
    return "\n".join(lines)


def answer(db: Session, user: User, question: str) -> str:
    include_targets = not _mentions(question, RESTRICTION_WORDS) and not getattr(user, "hide_calorie_targets", False)
    context = build_context(db, user, include_targets=include_targets)

    client = get_client()
    model = os.getenv("COACH_MODEL") or getattr(settings, "COACH_MODEL", "llama-3.3-70b-versatile")
    max_tokens = int(os.getenv("COACH_MAX_TOKENS", getattr(settings, "COACH_MAX_TOKENS", 600)))

    user_content = f"Athlete Context:\n{context}\n\nAthlete Question:\n{question}"

    response = client.chat.completions.create(
        model=model,
        max_tokens=max_tokens,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
    )
    return response.choices[0].message.content or ""


def _increment_usage(db: Session, user_id: str, used_on: date) -> None:
    dialect_name = db.bind.dialect.name if db.bind else "postgresql"
    if dialect_name == "postgresql":
        from sqlalchemy.dialects.postgresql import insert as pg_insert

        stmt = pg_insert(CoachUsage).values(
            user_id=user_id,
            used_on=used_on,
            calls=1,
        )
        stmt = stmt.on_conflict_do_update(
            constraint="uq_coach_usage_user_day",
            set_={"calls": CoachUsage.calls + 1},
        )
        db.execute(stmt)
    elif dialect_name == "sqlite":
        from sqlalchemy.dialects.sqlite import insert as sqlite_insert

        stmt = sqlite_insert(CoachUsage).values(
            user_id=user_id,
            used_on=used_on,
            calls=1,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=["user_id", "used_on"],
            set_={"calls": CoachUsage.calls + 1},
        )
        db.execute(stmt)
    else:
        usage = db.query(CoachUsage).filter(CoachUsage.user_id == user_id, CoachUsage.used_on == used_on).first()
        if usage:
            usage.calls = CoachUsage.calls + 1
        else:
            usage = CoachUsage(user_id=user_id, used_on=used_on, calls=1)
            db.add(usage)
    db.commit()


def coach_reply(db: Session, user: User, question: str) -> str | None:
    # 1. If is_crisis(question): return crisis_reply() right away, for every user,
    # even when COACH_ENABLED is false. Do not count a call.
    if is_crisis(question):
        return crisis_reply()

    # 2. If COACH_ENABLED is not "true": return None. The caller then uses the rule-based reply.
    enabled_val = os.getenv("COACH_ENABLED", getattr(settings, "COACH_ENABLED", "false"))
    if str(enabled_val).lower() != "true":
        return None

    today = date.today()

    # 3. If today's total calls across all users is at or above COACH_GLOBAL_DAILY_LIMIT (default 1000):
    # return a friendly "coach is resting today; logging still works" message.
    global_limit = int(os.getenv("COACH_GLOBAL_DAILY_LIMIT", getattr(settings, "COACH_GLOBAL_DAILY_LIMIT", 1000)))
    total_calls_today = (
        db.query(func.coalesce(func.sum(CoachUsage.calls), 0)).filter(CoachUsage.used_on == today).scalar() or 0
    )
    if total_calls_today >= global_limit:
        return "The AI Coach is resting today after reaching capacity; tracking and logging still work as normal."

    # 4. If this user's calls today are at or above COACH_DAILY_LIMIT (default 20):
    # return a friendly "daily coach limit reached; logging still works" message.
    user_limit = int(os.getenv("COACH_DAILY_LIMIT", getattr(settings, "COACH_DAILY_LIMIT", 20)))
    user_usage = db.query(CoachUsage).filter(CoachUsage.user_id == user.user_id, CoachUsage.used_on == today).first()
    user_calls = user_usage.calls if user_usage else 0
    if user_calls >= user_limit:
        return "You have reached your daily AI Coach limit for today; tracking and logging still work as normal."

    # 5. Increment this user's count for today with an upsert and commit before the model call.
    _increment_usage(db, user.user_id, today)

    # 6. Call answer(). If it raises, log with logger.exception including only the user ID,
    # never the question text, and return None so the caller uses the rule-based reply.
    try:
        reply_text = answer(db, user, question)
    except Exception:
        logger.exception("AI Coach model call failed for user_id=%s", user.user_id)
        return None

    # 7. On success, append this disclaimer on a new line:
    reply_text = reply_text.strip()
    if reply_text:
        return f"{reply_text}\n\n{COACH_DISCLAIMER}"
    return COACH_DISCLAIMER
