# MyFitSync REST API Specification (v1)

**Base URL:** `http://localhost:8000/api/v1` (Production: `https://myfitsync.example.com/api/v1`)  
**Specification Version:** 1.0.0  
**Authentication Scheme:** HTTP Bearer JSON Web Token (JWT)

---

## 1. Global Request & Response Contract

### Headers
| Header | Required | Purpose |
|---|---|---|
| `Content-Type` | Yes (for POST/PUT/PATCH) | Must be `application/json` |
| `Authorization` | Yes (protected endpoints) | `Bearer <access_token>` |
| `X-Idempotency-Key` | Optional (supported on `/chat`) | UUID or client string to prevent duplicate persistence |

### Standard Error Schema
All error responses adhere to the standard JSON structure:
```json
{
  "error": {
    "code": "validation_error",
    "message": "The submitted data failed validation.",
    "details": [
      "body -> weight_kg: Input should be greater than or equal to 0"
    ]
  }
}
```

### Standard Status Codes
- `200 OK`: Request succeeded, returning requested object or aggregated metrics.
- `201 Created`: Resource successfully created and committed.
- `204 No Content`: Resource deleted or action executed with no return content.
- `400 Bad Request`: Invalid request syntax or malformed input.
- `401 Unauthorized`: Missing, expired, or tampered JWT.
- `404 Not Found`: Resource does not exist or belongs to another user (strictly enforced).
- `409 Conflict`: Attempted duplicate registration of an existing email.
- `422 Unprocessable Entity`: Schema validation or sports science mathematical constraint failure.
- `429 Too Many Requests`: Rate limit exceeded (SlowAPI limit or 5 failed login lockout).
- `503 Service Unavailable`: Database connectivity failure during readiness probe.

---

## 2. Authentication Endpoints (`/auth`)

### `POST /auth/register`
Creates a new athlete account.
- **Request Body:**
  ```json
  {
    "email": "athlete@example.com",
    "password": "StrongPassword2026!",
    "name": "Alex Mercer",
    "bodyweight_kg": 78.5,
    "target_calories": 2600,
    "target_protein_g": 160.0,
    "target_carbs_g": 280.0,
    "target_fat_g": 75.0,
    "timezone": "UTC"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "user_id": "17afc638-b54d-4d34-8b27-1f01d2b4e55e",
    "email": "athlete@example.com",
    "name": "Alex Mercer",
    "bodyweight_kg": 78.5,
    "target_calories": 2600,
    "target_protein_g": 160.0,
    "target_carbs_g": 280.0,
    "target_fat_g": 75.0,
    "timezone": "UTC",
    "created_at": "2026-11-09T05:40:00Z"
  }
  ```

### `POST /auth/login`
Authenticates user credentials and issues JWT token pair.
- **Request Body:**
  ```json
  {
    "email": "athlete@example.com",
    "password": "StrongPassword2026!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "expires_in_seconds": 3600
  }
  ```

### `POST /auth/refresh`
Rotates access and refresh tokens using a valid refresh token.

### `GET /auth/me`
Retrieves the authenticated athlete profile.

### `PATCH /auth/me`
Partially updates athlete profile, biometric targets, and timezone.

---

## 3. Intelligent Chat Assistant (`/chat`)

### `POST /chat`
Accepts natural language text in plain English, segments multi-intent clauses, computes sports science metrics, commits records within a single transaction, and handles idempotency deduplication.

- **Headers:**
  - `Authorization: Bearer <token>`
  - `X-Idempotency-Key: <unique-client-uuid>`
- **Request Body:**
  ```json
  {
    "message": "Squats 100 kg 5 reps 3 sets at RPE 8, bench 70 kg for 8 reps x 3, ate 2200 kcal with 160 g protein, slept 7 hours",
    "timezone": "UTC"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "reply": "Logged 2 workouts (Squat, Bench Press), 1 meal (Meal), and daily recovery for 2026-11-09.",
    "saved": {
      "workouts": [
        {
          "id": 142,
          "exercise": "squat",
          "weight_kg": 100.0,
          "reps": 5,
          "sets": 3,
          "rpe": 8.0,
          "performed_on": "2026-11-09"
        },
        {
          "id": 143,
          "exercise": "bench_press",
          "weight_kg": 70.0,
          "reps": 8,
          "sets": 3,
          "rpe": null,
          "performed_on": "2026-11-09"
        }
      ],
      "nutrition": [
        {
          "id": 98,
          "meal_title": "Meal",
          "calories": 2200.0,
          "protein_g": 160.0,
          "carbs_g": null,
          "fat_g": null,
          "eaten_on": "2026-11-09"
        }
      ],
      "readiness": [
        {
          "id": 45,
          "sleep_hours": 7.0,
          "soreness_score": null,
          "resting_hr": null,
          "logged_date": "2026-11-09"
        }
      ]
    },
    "clarifications": [],
    "warnings": []
  }
  ```

---

## 4. Workouts Resource (`/workouts`)

- `POST /workouts`: Creates a structured workout entry.
- `GET /workouts`: Lists paginated workouts. Query parameters: `page`, `page_size`, `exercise`, `from`, `to`.
- `GET /workouts/{id}`: Retrieves single workout by ID. Strictly 404 if belonging to another user.
- `PUT /workouts/{id}`: Updates workout details and automatically recalculates volume and estimated 1RM.
- `DELETE /workouts/{id}`: Deletes workout record (204 No Content).

---

## 5. Nutrition Resource (`/nutrition`)

- `POST /nutrition`: Logs a meal with calories and optional macros.
- `GET /nutrition`: Lists paginated nutrition entries.
- `GET /nutrition/daily-totals`: Aggregates total calories, protein, carbs, fat, and Atwater macro split for a specific date (`?date=YYYY-MM-DD`).
- `GET /nutrition/{id}`: Retrieves single nutrition entry.
- `PUT /nutrition/{id}`: Updates nutrition details.
- `DELETE /nutrition/{id}`: Deletes nutrition entry (204 No Content).

---

## 6. Daily Readiness Resource (`/readiness`)

- `POST /readiness`: Creates or upserts the readiness record for a given calendar date.
- `GET /readiness`: Lists paginated readiness entries with date range filters.
- `GET /readiness/{id}`: Retrieves single readiness entry.
- `PUT /readiness/{id}`: Updates readiness entry.
- `DELETE /readiness/{id}`: Deletes readiness entry (204 No Content).

---

## 7. Dashboard & Analytics Endpoints

### `GET /dashboard`
Provides the full dashboard payload in a single query:
- `totals`: Total volume (kg), workouts count, active training days.
- `latest_e1rm`: Map of exercises to their highest recent 1RM.
- `today_nutrition`: Daily calories, protein, carbs, fat, Atwater macro split, and discrepancy flags.
- `last_readiness`: Most recent sleep hours, soreness score, and resting heart rate.
- `acwr`: Full Acute:Chronic Workload Ratio block including acute load, chronic load, zone, ratio, and mandatory disclaimer.
- `recent_activity`: Recent 5 workouts, meals, and recovery logs.
- `is_empty`: Boolean flags indicating which sections lack data.

### `GET /analytics/acwr`
Returns dedicated ACWR metrics for a specific target date (`?date=YYYY-MM-DD`).

### `GET /analytics/strength`
Returns chronological progression of estimated 1RM for an exercise (`?exercise=squat`).

### `GET /analytics/volume`
Returns aggregated training volume grouped by day or week (`?group_by=daily|weekly`).

---

## 8. Health & Operations Endpoints

### `GET /health`
Liveness probe. Returns `{"status": "ok", "service": "MyFitSync Backend"}` (HTTP 200).

### `GET /health/ready`
Readiness probe. Executes `SELECT 1` on Microsoft SQL Server.
- Returns `{"status": "ready", "database": "connected"}` (HTTP 200).
- If database is unreachable: returns HTTP 503 Service Unavailable.
