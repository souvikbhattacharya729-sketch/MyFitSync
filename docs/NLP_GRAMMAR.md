# MyFitSync Deterministic NLP Grammar Specification

This document provides the formal grammar specification for the **deterministic, rule-based natural language processing engine** utilized in MyFitSync.

---

## 1. Architectural Philosophy

Unlike stochastic Large Language Models (LLMs) that can hallucinate values, alter numbers, or fail under network isolation, MyFitSync's NLP pipeline is **strictly deterministic, offline-capable, and mathematically audited**:
- **Zero Hallucination:** Exact weights, reps, sets, calories, and sleep hours are extracted verbatim using validated regular expressions.
- **Fast Execution:** Processing latency is typically $<5\text{ ms}$ per phrase.
- **Reproducible:** Given the identical natural language input, the parser produces the identical abstract syntax tree and database records every time.

---

## 2. Normalization Pipeline

Every input string passes through four sequential normalization stages before tokenization:
1. **Case Normalization:** String is converted to lowercase.
2. **Abbreviation Expansion:** Common gym terminology is normalized (e.g. `lbs` $\to$ `lb`, `sec` $\to$ `seconds`, `mins` $\to$ `minutes`, `cal` $\to$ `kcal`).
3. **Punctuation & Unit Cleanup:** Commas between numbers (e.g. `1,000` $\to$ `1000`) are desensitized.
4. **Continuation Protection:** Commas followed by continuation phrases (e.g. `bench 100 kg for 5 reps, 3 sets`) are preserved to prevent premature clause splitting.

---

## 3. Supported Workout Syntaxes

The engine recognizes all common lifting notations, supporting both metric (`kg`) and imperial (`lb`) units.

### Pattern A: Standard Verbose
`<Exercise> <Weight> [kg|lb] [for] <Reps> reps[,] <Sets> sets [@ <RPE>]`
- **Example:** `"Bench press 100 kg for 5 reps, 3 sets at RPE 8"`
- **Parsed:** Exercise = `bench_press`, Weight = `100.0 kg`, Reps = `5`, Sets = `3`, RPE = `8.0`

### Pattern B: Multiplier Notation
`<Exercise> <Sets>x<Reps> [@ <Weight> [kg|lb]] [@ <RPE>]`
- **Example:** `"Squats 3x5 @ 120kg @ 8.5"`
- **Parsed:** Exercise = `squat`, Sets = `3`, Reps = `5`, Weight = `120.0 kg`, RPE = `8.5`

### Pattern C: Reverse Multiplier Notation
`<Exercise> <Weight> [kg|lb] [x] <Reps> reps x <Sets> sets`
- **Example:** `"Deadlift 140 kg x 5 reps x 3 sets"`
- **Parsed:** Exercise = `deadlift`, Weight = `140.0 kg`, Reps = `5`, Sets = `3`

### Pattern D: Bodyweight Exercise
`<Exercise> <Sets>x<Reps> [bodyweight]`
- **Example:** `"Pull-ups 3x8"`
- **Parsed:** Exercise = `pull_up`, Sets = `3`, Reps = `8`, Weight = `0.0 kg`

### Pattern E: Imperial Weight Auto-Conversion
- **Example:** `"overhead press 135 lbs for 5 reps 3 sets"`
- **Conversion Equation:** $\text{weight\_kg} = \text{round}(135 \times 0.45359237, 1) = 61.2\text{ kg}$
- **Parsed:** Exercise = `overhead_press`, Weight = `61.2 kg`, Reps = `5`, Sets = `3`

---

## 4. Exercise Alias Mapping

Aliases are resolved against `app/services/exercise_aliases.json`:
| Raw User Phrase | Normalized Canonical Key |
|---|---|
| `bench`, `bench press`, `flat bench`, `bp` | `bench_press` |
| `squat`, `squats`, `back squat` | `squat` |
| `deadlift`, `deadlifts`, `dl` | `deadlift` |
| `ohp`, `overhead press`, `military press`, `shoulder press` | `overhead_press` |
| `row`, `barbell row`, `bent over row`, `pendlay row` | `barbell_row` |
| `pullup`, `pullups`, `pull-ups`, `chin-up` | `pull_up` |
| `incline bench`, `incline press` | `incline_bench_press` |
| `rdl`, `romanian deadlift` | `romanian_deadlift` |

---

## 5. Nutrition Grammar Patterns

Extracts meal titles, total calories, and macronutrient breakdowns:

### Calorie & Macro Syntax
- **Example 1:** `"Ate 2200 kcal with 160g protein, 220g carbs, 65g fat"`
  - `calories`: 2200.0, `protein_g`: 160.0, `carbs_g`: 220.0, `fat_g`: 65.0
- **Example 2:** `"Lunch: Chicken rice bowl 750 calories and 55g protein"`
  - `meal_title`: `"Chicken rice bowl"`, `calories`: 750.0, `protein_g`: 55.0
- **Example 3:** `"protein shake with 300 kcal"`
  - `meal_title`: `"Protein shake"`, `calories`: 300.0

---

## 6. Daily Readiness Grammar Patterns

Captures restorative sleep, muscle fatigue, and resting cardiovascular metrics:

### Sleep Duration
- `"slept 7.5 hours"` $\to$ `sleep_hours: 7.5`
- `"got 8 hrs of sleep"` $\to$ `sleep_hours: 8.0`

### Soreness Rating
- `"soreness 4/10"` $\to$ `soreness_score: 4.0`
- `"muscle soreness rated 6"` $\to$ `soreness_score: 6.0`

### Resting Heart Rate
- `"resting hr 54 bpm"` $\to$ `resting_hr: 54`
- `"resting heart rate 58"` $\to$ `resting_hr: 58`

---

## 7. Multi-Intent Segmentation & Clarifications

### Conjunction Splitting
When an athlete enters a composite status:
> `"Squats 100 kg 5 reps 3 sets, bench 70 kg 8x3, ate 2200 kcal with 160g protein, slept 7 hours"`

The segmenter divides the phrase along clause boundaries (`and`, `,`, `;`, `then`, `also`) into 4 independent clauses, parsing each intent concurrently.

### Clarification Generation
If required fields cannot be deterministically inferred, interactive clarification chips are generated:
- **Missing Sets or Reps:** `"Did 100kg bench"` $\to$ Generates prompt: `"How many sets and reps did you complete for bench press?"` with interactive chips `[5 reps, 3 sets]`, `[5 sets of 5]`, `[10 reps, 3 sets]`.
- **Ambiguous Nutrition:** `"Ate a sandwich"` $\to$ Prompts athlete for approximate calories or macros.
