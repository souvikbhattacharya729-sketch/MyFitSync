import json
import os
import re
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from typing import Dict, List, Tuple
from zoneinfo import ZoneInfo

NUMBER_WORDS = {
    "zero": 0,
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10,
    "eleven": 11,
    "twelve": 12,
    "thirteen": 13,
    "fourteen": 14,
    "fifteen": 15,
    "sixteen": 16,
    "seventeen": 17,
    "eighteen": 18,
    "nineteen": 19,
    "twenty": 20,
}

MONTH_MAP = {
    "jan": 1,
    "january": 1,
    "feb": 2,
    "february": 2,
    "mar": 3,
    "march": 3,
    "apr": 4,
    "april": 4,
    "may": 5,
    "jun": 6,
    "june": 6,
    "jul": 7,
    "july": 7,
    "aug": 8,
    "august": 8,
    "sep": 9,
    "september": 9,
    "oct": 10,
    "october": 10,
    "nov": 11,
    "november": 11,
    "dec": 12,
    "december": 12,
}


def load_exercise_aliases() -> Dict[str, List[str]]:
    alias_path = os.path.join(os.path.dirname(__file__), "exercise_aliases.json")
    if os.path.exists(alias_path):
        with open(alias_path, encoding="utf-8") as f:
            return json.load(f)
    return {
        "bench_press": ["bench", "bench press", "flat bench"],
        "squat": ["squat", "squats", "back squat"],
        "deadlift": ["deadlift", "deadlifts"],
        "overhead_press": ["overhead press", "ohp", "military press"],
        "barbell_row": ["row", "rows", "barbell row"],
        "pull_up": ["pull up", "pull ups", "pull-up", "pull-ups"],
    }


EXERCISE_ALIASES = load_exercise_aliases()


@dataclass
class ParsedWorkout:
    exercise: str
    exercise_raw: str
    weight_kg: float
    reps: int
    sets: int
    rpe: float | None = None
    performed_on: date | None = None
    original_unit: str | None = None


@dataclass
class ParsedNutrition:
    meal_title: str | None = None
    calories: float | None = None
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None
    eaten_on: date | None = None


@dataclass
class ParsedReadiness:
    sleep_hours: float | None = None
    soreness_score: float | None = None
    resting_hr: int | None = None
    logged_date: date | None = None


@dataclass
class Clarification:
    field: str
    exercise: str | None = None
    question: str = ""


@dataclass
class ParseResult:
    workouts: List[ParsedWorkout] = field(default_factory=list)
    nutrition: List[ParsedNutrition] = field(default_factory=list)
    readiness: List[ParsedReadiness] = field(default_factory=list)
    clarifications: List[Clarification] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    unparsed_clauses: List[str] = field(default_factory=list)


class DeterministicNLPParser:
    """
    Deterministic rule-based pipeline for parsing fitness text entries.
    Designed behind the ParseResult interface so an LLM adapter can be substituted seamlessly.
    """

    def __init__(self, exercise_aliases: Dict[str, List[str]] | None = None):
        self.aliases = exercise_aliases or EXERCISE_ALIASES

    def normalize(self, text: str) -> str:
        s = text.lower().strip()
        # Replace multiplication symbols
        s = s.replace("×", "x").replace("✕", "x")

        # Convert hours and minutes notation: e.g. "7h30m" or "7h 30m" -> "7.5 hours"
        def h_m_replacer(m: re.Match) -> str:
            h = float(m.group(1))
            mins = float(m.group(2))
            return f"{h + round(mins / 60.0, 2)} hours"

        s = re.sub(r"(\d+)\s*h\s*(\d+)\s*m(?:in(?:ute)?s?)?", h_m_replacer, s)

        # Unify units
        s = re.sub(r"\b(kilograms?|kilos?|kgs?)\b", "kg", s)
        s = re.sub(r"\b(pounds?|lbs?)\b", "lb", s)

        # Replace standalone number words
        for word, val in NUMBER_WORDS.items():
            s = re.sub(rf"\b{word}\b", str(val), s)

        return s

    def segment_clauses(self, text: str) -> List[str]:
        # Protect commas that are followed by continuation phrases (e.g., ", 3 sets", ", 5 reps", ", 250 g carbs", ", 70g fat", ", @8")
        protected = re.sub(
            r",\s*(?=\d+\s*(?:sets?|reps?|g\s*(?:protein|carbs?|fat)|kcal|calories)|(?:rpe|@)|\bx\s*\d+)", " ", text
        )
        # Protect decimal numbers (e.g. 7.5 or 8.5) from being split by periods
        protected = re.sub(r"(\d+)\.(\d+)", r"\1__DEC__\2", protected)
        raw_parts = re.split(r"(?:,|;|\n|\band\s+then\b|\bthen\b|\.(?!\S))", protected)
        clauses = []
        for part in raw_parts:
            cleaned = part.replace("__DEC__", ".").strip()
            if cleaned:
                clauses.append(cleaned)
        return clauses

    def resolve_date(self, text: str, user_tz_name: str = "UTC", is_sleep: bool = False) -> date:
        try:
            tz = ZoneInfo(user_tz_name)
        except Exception:
            tz = ZoneInfo("UTC")

        now = datetime.now(tz)
        today = now.date()

        # Check explicit ISO date (YYYY-MM-DD)
        iso_match = re.search(r"\b(20\d\d)-(\d{1,2})-(\d{1,2})\b", text)
        if iso_match:
            try:
                return date(int(iso_match.group(1)), int(iso_match.group(2)), int(iso_match.group(3)))
            except ValueError:
                pass

        # Check explicit formats like "8 Nov", "8th November", "Nov 8"
        date_word_match = re.search(r"\b(\d{1,2})(?:st|nd|rd|th)?\s+([a-zA-Z]+)(?:\s+(20\d\d))?\b", text)
        if date_word_match:
            day = int(date_word_match.group(1))
            month_str = date_word_match.group(2).lower()
            year = int(date_word_match.group(3)) if date_word_match.group(3) else today.year
            if month_str in MONTH_MAP:
                try:
                    return date(year, MONTH_MAP[month_str], day)
                except ValueError:
                    pass

        rev_match = re.search(r"\b([a-zA-Z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(20\d\d))?\b", text)
        if rev_match:
            month_str = rev_match.group(1).lower()
            day = int(rev_match.group(2))
            year = int(rev_match.group(3)) if rev_match.group(3) else today.year
            if month_str in MONTH_MAP:
                try:
                    return date(year, MONTH_MAP[month_str], day)
                except ValueError:
                    pass

        # Relative keywords
        if "yesterday" in text:
            return today - timedelta(days=1)
        if "last night" in text:
            return today if not is_sleep else today - timedelta(days=1)
        if "this morning" in text or "today" in text:
            return today

        return today

    def find_exercise(self, text: str) -> Tuple[str, str] | None:
        """Matches canonical exercise name and raw exercise string."""
        for canonical, alias_list in self.aliases.items():
            for alias in alias_list:
                pattern = rf"\b{re.escape(alias)}\b"
                match = re.search(pattern, text)
                if match:
                    return canonical, match.group(0)
        return None

    def parse(self, text: str, user_timezone: str = "UTC") -> ParseResult:
        normalized = self.normalize(text)
        clauses = self.segment_clauses(normalized)
        result = ParseResult()

        for clause in clauses:
            consumed = False
            # 1. Check for Readiness (Sleep / Soreness / Resting HR)
            if self._try_parse_readiness(clause, user_timezone, result):
                consumed = True

            # 2. Check for Nutrition
            if self._try_parse_nutrition(clause, user_timezone, result):
                consumed = True

            # 3. Check for Workout
            if self._try_parse_workout(clause, user_timezone, result):
                consumed = True

            if not consumed:
                # Check if it was an empty or unidentifiable clause
                # If clause has numbers with no context, request clarification
                raw_nums = re.findall(r"\b\d+(?:\.\d+)?\b", clause)
                if raw_nums and not any(
                    kw in clause for kw in ["set", "rep", "kg", "lb", "cal", "kcal", "hour", "hr", "sleep", "rhr"]
                ):
                    result.clarifications.append(
                        Clarification(
                            field="unknown_measurement",
                            question=f"I noticed '{clause}' with number(s) {', '.join(raw_nums)} but no unit or context. Could you clarify what this measurement is for?",
                        )
                    )
                else:
                    result.unparsed_clauses.append(clause)

        return result

    def _try_parse_readiness(self, clause: str, user_tz: str, result: ParseResult) -> bool:
        has_sleep = any(k in clause for k in ["sleep", "slept"])
        has_soreness = any(k in clause for k in ["sore", "soreness"])
        has_rhr = any(k in clause for k in ["resting heart rate", "rhr", "resting hr", "bpm"])

        if not (has_sleep or has_soreness or has_rhr):
            return False

        logged_date = self.resolve_date(clause, user_tz, is_sleep=has_sleep)
        sleep_hours: float | None = None
        soreness_score: float | None = None
        resting_hr: int | None = None

        if has_sleep:
            m = re.search(r"(?:slept|sleep)\s*(?:for\s*)?(\d+(?:\.\d+)?)\s*(?:h|hrs|hours?)?", clause)
            if m:
                val = float(m.group(1))
                if val > 24.0 or val < 0.0:
                    result.clarifications.append(
                        Clarification(
                            field="sleep_hours",
                            question=f"Sleep duration ({val} hours) is outside the valid physiological range of 0 to 24 hours. Please re-enter your sleep duration.",
                        )
                    )
                    return True
                sleep_hours = val

        if has_soreness:
            # Matches: "sore 8/10", "soreness 8 out of 10", "legs sore 8/10", "sore 7"
            m = re.search(r"(?:sore(?:ness)?)\s*(?:is\s*)?(\d+(?:\.\d+)?)\s*(?:/\s*10|out\s+of\s+10)?", clause)
            if not m:
                m = re.search(r"(\d+(?:\.\d+)?)\s*(?:/\s*10|out\s+of\s+10)", clause)
            if m:
                val = float(m.group(1))
                if val < 1.0 or val > 10.0:
                    result.clarifications.append(
                        Clarification(
                            field="soreness_score",
                            question=f"Soreness score ({val}) must be between 1 and 10. Please clarify your soreness level.",
                        )
                    )
                    return True
                soreness_score = val

        if has_rhr:
            m = re.search(r"(?:resting\s*(?:heart\s*rate|hr)|rhr)\s*(?:is\s*)?(\d+)\s*(?:bpm)?", clause)
            if not m:
                m = re.search(r"(\d+)\s*bpm", clause)
            if m:
                val = int(m.group(1))
                if val <= 0 or val >= 250:
                    result.clarifications.append(
                        Clarification(
                            field="resting_hr",
                            question=f"Resting heart rate ({val} bpm) is out of valid range (1 - 249 bpm). Please clarify.",
                        )
                    )
                    return True
                resting_hr = val

        if sleep_hours is not None or soreness_score is not None or resting_hr is not None:
            # Check if there is already a readiness object for this date in the result
            for existing in result.readiness:
                if existing.logged_date == logged_date:
                    if sleep_hours is not None:
                        existing.sleep_hours = sleep_hours
                    if soreness_score is not None:
                        existing.soreness_score = soreness_score
                    if resting_hr is not None:
                        existing.resting_hr = resting_hr
                    return True

            result.readiness.append(
                ParsedReadiness(
                    sleep_hours=sleep_hours,
                    soreness_score=soreness_score,
                    resting_hr=resting_hr,
                    logged_date=logged_date,
                )
            )
            return True

        return False

    def _try_parse_nutrition(self, clause: str, user_tz: str, result: ParseResult) -> bool:
        has_cal = bool(re.search(r"\b(\d+(?:\.\d+)?)\s*(?:calories|kcal)\b", clause))
        has_protein = bool(re.search(r"\b(\d+(?:\.\d+)?)\s*g?\s*protein\b", clause))
        has_carbs = bool(re.search(r"\b(\d+(?:\.\d+)?)\s*g?\s*carbs?\b", clause))
        has_fat = bool(re.search(r"\b(\d+(?:\.\d+)?)\s*g?\s*fat\b", clause))
        has_ate = bool(re.search(r"\b(ate|had|eating|eaten)\b", clause))

        if not (has_cal or has_protein or has_carbs or has_fat or has_ate):
            return False

        eaten_date = self.resolve_date(clause, user_tz)
        cal_val: float | None = None
        pro_val: float | None = None
        carb_val: float | None = None
        fat_val: float | None = None

        cal_m = re.search(r"\b(\d+(?:\.\d+)?)\s*(?:calories|kcal)\b", clause)
        if cal_m:
            cal_val = float(cal_m.group(1))

        pro_m = re.search(r"\b(\d+(?:\.\d+)?)\s*g?\s*protein\b", clause)
        if pro_m:
            pro_val = float(pro_m.group(1))

        carb_m = re.search(r"\b(\d+(?:\.\d+)?)\s*g?\s*carbs?\b", clause)
        if carb_m:
            carb_val = float(carb_m.group(1))

        fat_m = re.search(r"\b(\d+(?:\.\d+)?)\s*g?\s*fat\b", clause)
        if fat_m:
            fat_val = float(fat_m.group(1))

        # Check for food item with grams but no macro data (e.g. "ate 200g chicken")
        food_m = re.search(r"\b(?:ate|had)\s+(\d+\s*g?\s+[a-zA-Z\s]+)", clause)
        meal_title = None
        if food_m and not (cal_val or pro_val or carb_val or fat_val):
            meal_title = food_m.group(0).strip()
            # Requirement: "store as a meal title without invented macros and ask whether the user wants to add calories/macros"
            result.clarifications.append(
                Clarification(
                    field="nutrition_macros",
                    question=f"Logged '{meal_title}'. Would you like to add calories or macros for this meal?",
                )
            )

        if cal_val is not None or pro_val is not None or carb_val is not None or fat_val is not None or meal_title:
            if (
                result.nutrition
                and result.nutrition[-1].eaten_on == eaten_date
                and not meal_title
                and result.nutrition[-1].meal_title == "Meal"
            ):
                existing = result.nutrition[-1]
                if cal_val is not None:
                    existing.calories = (existing.calories or 0.0) + cal_val
                if pro_val is not None:
                    existing.protein_g = (existing.protein_g or 0.0) + pro_val
                if carb_val is not None:
                    existing.carbs_g = (existing.carbs_g or 0.0) + carb_val
                if fat_val is not None:
                    existing.fat_g = (existing.fat_g or 0.0) + fat_val
            else:
                result.nutrition.append(
                    ParsedNutrition(
                        meal_title=meal_title or "Meal",
                        calories=cal_val,
                        protein_g=pro_val,
                        carbs_g=carb_val,
                        fat_g=fat_val,
                        eaten_on=eaten_date,
                    )
                )
            return True

        return False

    def _try_parse_workout(self, clause: str, user_tz: str, result: ParseResult) -> bool:
        ex_info = self.find_exercise(clause)
        if not ex_info:
            return False

        canonical_ex, raw_ex = ex_info
        performed_on = self.resolve_date(clause, user_tz)

        # Extract RPE if present (ensure @100kg is not mistaken for RPE)
        rpe_val: float | None = None
        rpe_m = re.search(r"(?:(?:at\s+)?rpe\s*(\d+(?:\.\d+)?)|@\s*(\d+(?:\.\d+)?)(?!\s*(?:kg|lb)))", clause)
        if rpe_m:
            rpe_str = rpe_m.group(1) or rpe_m.group(2)
            if rpe_str:
                cand_rpe = float(rpe_str)
                if cand_rpe < 1.0 or cand_rpe > 10.0:
                    result.clarifications.append(
                        Clarification(
                            field="rpe",
                            exercise=canonical_ex,
                            question=f"RPE {cand_rpe} for {raw_ex} is out of the valid 1.0–10.0 range. Please clarify.",
                        )
                    )
                    return True
                rpe_val = cand_rpe

        # Pattern 1: "100 kg for 5 reps, 3 sets", "100 kg for 5 reps 3 sets", or "70 kg for 8 reps x 3"
        p1 = re.search(
            r"(\d+(?:\.\d+)?)\s*(kg|lb)\s+(?:for\s+)?(\d+)\s*reps?(?:\s*(?:x|,|\band\b)?\s*(\d+)\s*sets?|\s*x\s*(\d+))?",
            clause,
        )
        if p1:
            raw_weight = float(p1.group(1))
            unit = p1.group(2)
            reps = int(p1.group(3))
            sets_str = p1.group(4) or p1.group(5)
            if not sets_str:
                result.clarifications.append(
                    Clarification(
                        field="sets", exercise=canonical_ex, question=f"How many sets of {raw_ex} did you perform?"
                    )
                )
                return True
            sets = int(sets_str)
            return self._record_workout(
                result, canonical_ex, raw_ex, raw_weight, unit, reps, sets, rpe_val, performed_on
            )

        # Pattern 2: "3 sets of 5 at 100 kg" or "3 sets of 5 reps at 100 kg"
        p2 = re.search(r"(\d+)\s*sets?\s+of\s+(\d+)(?:\s*reps?)?\s+(?:at|@)\s*(\d+(?:\.\d+)?)\s*(kg|lb)", clause)
        if p2:
            sets = int(p2.group(1))
            reps = int(p2.group(2))
            raw_weight = float(p2.group(3))
            unit = p2.group(4)
            return self._record_workout(
                result, canonical_ex, raw_ex, raw_weight, unit, reps, sets, rpe_val, performed_on
            )

        # Pattern 3: "3x5 @ 100kg" or "3x5 at 100kg"
        p3 = re.search(r"(\d+)\s*x\s*(\d+)\s*(?:@|at)\s*(\d+(?:\.\d+)?)\s*(kg|lb)", clause)
        if p3:
            sets = int(p3.group(1))
            reps = int(p3.group(2))
            raw_weight = float(p3.group(3))
            unit = p3.group(4)
            return self._record_workout(
                result, canonical_ex, raw_ex, raw_weight, unit, reps, sets, rpe_val, performed_on
            )

        # Pattern 4: "100kg x 5 x 3" (weight x reps x sets)
        p4 = re.search(r"(\d+(?:\.\d+)?)\s*(kg|lb)\s*x\s*(\d+)\s*x\s*(\d+)", clause)
        if p4:
            raw_weight = float(p4.group(1))
            unit = p4.group(2)
            reps = int(p4.group(3))
            sets = int(p4.group(4))
            return self._record_workout(
                result, canonical_ex, raw_ex, raw_weight, unit, reps, sets, rpe_val, performed_on
            )

        # Pattern 5: "5x100kg" -> reps x weight or sets x weight? Missing sets or reps!
        # Requirement: "Sets/reps missing: ask. Never assume 1 set or 1 rep silently."
        p5 = re.search(r"(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*(kg|lb)", clause)
        if p5:
            num = int(p5.group(1))
            raw_weight = float(p5.group(2))
            unit = p5.group(3)
            result.clarifications.append(
                Clarification(
                    field="sets_or_reps",
                    exercise=canonical_ex,
                    question=f"For {raw_ex} at {raw_weight}{unit}, did you mean {num} reps or {num} sets? Please specify both sets and reps.",
                )
            )
            return True

        # Check if weight and reps provided without sets: e.g. "squat 100kg 5 reps"
        p_missing_sets = re.search(r"(\d+(?:\.\d+)?)\s*(kg|lb)\s+(\d+)\s*reps?", clause)
        if p_missing_sets:
            result.clarifications.append(
                Clarification(
                    field="sets", exercise=canonical_ex, question=f"How many sets of {raw_ex} did you perform?"
                )
            )
            return True

        # If exercise mentioned without full weight, reps, or sets
        result.clarifications.append(
            Clarification(
                field="workout_details",
                exercise=canonical_ex,
                question=f"I recognized {raw_ex}. Could you provide the weight, reps, and sets (e.g. '100 kg for 5 reps, 3 sets')?",
            )
        )
        return True

    def _record_workout(
        self,
        result: ParseResult,
        canonical_ex: str,
        raw_ex: str,
        raw_weight: float,
        unit: str,
        reps: int,
        sets: int,
        rpe_val: float | None,
        performed_on: date,
    ) -> bool:
        # Check validation limits
        if reps <= 0 or sets <= 0 or raw_weight < 0:
            result.clarifications.append(
                Clarification(
                    field="validation",
                    exercise=canonical_ex,
                    question=f"Invalid workout numbers for {raw_ex}: weight must be >= 0, reps > 0, sets > 0.",
                )
            )
            return True

        # Handle pound conversion
        final_weight_kg = raw_weight
        orig_unit = None
        if unit == "lb":
            final_weight_kg = round(raw_weight * 0.45359237, 2)
            orig_unit = "lb"
            result.warnings.append(f"Converted {raw_weight} lbs to {final_weight_kg} kg for {raw_ex}.")

        result.workouts.append(
            ParsedWorkout(
                exercise=canonical_ex,
                exercise_raw=raw_ex,
                weight_kg=final_weight_kg,
                reps=reps,
                sets=sets,
                rpe=rpe_val,
                performed_on=performed_on,
                original_unit=orig_unit,
            )
        )
        return True
