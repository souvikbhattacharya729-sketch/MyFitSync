from datetime import date, timedelta
from app.services.nlp_parser import DeterministicNLPParser

def test_nlp_supported_workout_formats():
    parser = DeterministicNLPParser()

    # Format 1: 100 kg for 5 reps, 3 sets
    res1 = parser.parse("bench 100 kg for 5 reps, 3 sets")
    assert len(res1.workouts) == 1
    assert res1.workouts[0].exercise == "bench_press"
    assert res1.workouts[0].weight_kg == 100.0
    assert res1.workouts[0].reps == 5
    assert res1.workouts[0].sets == 3

    # Format 2: 3x5 @ 100kg
    res2 = parser.parse("squat 3x5 @ 100kg")
    assert len(res2.workouts) == 1
    assert res2.workouts[0].exercise == "squat"
    assert res2.workouts[0].sets == 3
    assert res2.workouts[0].reps == 5
    assert res2.workouts[0].weight_kg == 100.0

    # Format 3: 3 sets of 5 at 100 kg
    res3 = parser.parse("deadlift 3 sets of 5 at 100 kg")
    assert len(res3.workouts) == 1
    assert res3.workouts[0].exercise == "deadlift"
    assert res3.workouts[0].sets == 3
    assert res3.workouts[0].reps == 5
    assert res3.workouts[0].weight_kg == 100.0

    # Format 4: 100kg x 5 x 3
    res4 = parser.parse("overhead press 100kg x 5 x 3")
    assert len(res4.workouts) == 1
    assert res4.workouts[0].exercise == "overhead_press"
    assert res4.workouts[0].weight_kg == 100.0
    assert res4.workouts[0].reps == 5
    assert res4.workouts[0].sets == 3

def test_nlp_rpe_formats():
    parser = DeterministicNLPParser()
    res1 = parser.parse("squat 100 kg for 5 reps, 3 sets at RPE 8")
    assert res1.workouts[0].rpe == 8.0

    res2 = parser.parse("bench 100 kg for 5 reps, 3 sets @8.5")
    assert res2.workouts[0].rpe == 8.5

def test_nlp_missing_sets_reps_clarification():
    parser = DeterministicNLPParser()
    # Format: 5x100kg (ambiguous sets vs reps) -> must ask, never assume silently
    res = parser.parse("squat 5x100kg")
    assert len(res.workouts) == 0
    assert len(res.clarifications) == 1
    assert res.clarifications[0].field == "sets_or_reps"

    # Missing sets explicitly
    res2 = parser.parse("deadlift 120 kg 5 reps")
    assert len(res2.workouts) == 0
    assert len(res2.clarifications) == 1
    assert res2.clarifications[0].field == "sets"

def test_nlp_pound_conversion():
    parser = DeterministicNLPParser()
    res = parser.parse("bench 220 lb for 5 reps, 3 sets")
    assert len(res.workouts) == 1
    # 220 * 0.45359237 = 99.79 kg
    assert res.workouts[0].weight_kg == 99.79
    assert res.workouts[0].original_unit == "lb"
    assert any("Converted 220" in w for w in res.warnings)

def test_nlp_nutrition_formats():
    parser = DeterministicNLPParser()
    # Standard calories and macros
    res = parser.parse("ate 2200 kcal with 160 g protein, 250 g carbs, 70g fat")
    assert len(res.nutrition) == 1
    n = res.nutrition[0]
    assert n.calories == 2200.0
    assert n.protein_g == 160.0
    assert n.carbs_g == 250.0
    assert n.fat_g == 70.0

    # Food item with grams but no macros: never invent macros, store title and ask!
    res_food = parser.parse("ate 200g chicken")
    assert len(res_food.nutrition) == 1
    assert "ate 200g chicken" in res_food.nutrition[0].meal_title
    assert res_food.nutrition[0].calories is None
    assert res_food.nutrition[0].protein_g is None
    assert len(res_food.clarifications) == 1
    assert res_food.clarifications[0].field == "nutrition_macros"

def test_nlp_readiness_formats():
    parser = DeterministicNLPParser()

    # Slept 7 hours
    res1 = parser.parse("slept 7 hours")
    assert res1.readiness[0].sleep_hours == 7.0

    # Slept 7h30m -> 7.5 hours
    res2 = parser.parse("slept 7h30m")
    assert res2.readiness[0].sleep_hours == 7.5

    # Soreness 8 out of 10
    res3 = parser.parse("soreness 8 out of 10")
    assert res3.readiness[0].soreness_score == 8.0

    # Legs sore 8/10
    res4 = parser.parse("legs sore 8/10")
    assert res4.readiness[0].soreness_score == 8.0

    # RHR 52 bpm
    res5 = parser.parse("resting heart rate 52 bpm")
    assert res5.readiness[0].resting_hr == 52

def test_nlp_multi_intent_single_message():
    parser = DeterministicNLPParser()
    msg = "Squats 100 kg 5 reps 3 sets at RPE 8, bench 70 kg for 8 reps, 3 sets, ate 2200 kcal with 160 g protein, slept 7 hours."
    res = parser.parse(msg)

    assert len(res.workouts) == 2
    assert res.workouts[0].exercise == "squat"
    assert res.workouts[0].weight_kg == 100.0
    assert res.workouts[0].rpe == 8.0
    assert res.workouts[1].exercise == "bench_press"
    assert res.workouts[1].weight_kg == 70.0

    assert len(res.nutrition) == 1
    assert res.nutrition[0].calories == 2200.0
    assert res.nutrition[0].protein_g == 160.0

    assert len(res.readiness) == 1
    assert res.readiness[0].sleep_hours == 7.0

def test_nlp_out_of_range_rejections():
    parser = DeterministicNLPParser()

    # Sleep 30 hours -> rejected
    res_sleep = parser.parse("slept 30 hours")
    assert len(res_sleep.readiness) == 0
    assert len(res_sleep.clarifications) == 1
    assert "outside the valid physiological range" in res_sleep.clarifications[0].question

    # RPE 11 -> rejected
    res_rpe = parser.parse("squat 100 kg for 5 reps, 3 sets at RPE 11")
    assert len(res_rpe.workouts) == 0
    assert len(res_rpe.clarifications) == 1
    assert "out of the valid 1.0–10.0 range" in res_rpe.clarifications[0].question

def test_nlp_date_resolutions():
    parser = DeterministicNLPParser()
    today = date.today()

    res_yest = parser.parse("yesterday squat 100 kg for 5 reps, 3 sets")
    assert res_yest.workouts[0].performed_on == today - timedelta(days=1)

    res_iso = parser.parse("squat 100 kg for 5 reps, 3 sets on 2026-11-08")
    assert res_iso.workouts[0].performed_on == date(2026, 11, 8)
