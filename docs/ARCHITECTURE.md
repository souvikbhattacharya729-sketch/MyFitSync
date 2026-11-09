# MyFitSync System Architecture

This document describes the architectural foundation, component relationships, data flow sequences, and database design of **MyFitSync ("Your Personal Fitness Intelligence")**.

---

## 1. High-Level Architecture Overview

MyFitSync is an enterprise-grade fitness intelligence system built on a multi-tier, containerized architecture. It pairs a **deterministic, rule-based NLP pipeline** with **verified SQL Server persistence** and **peer-reviewed sports science formulations**.

```mermaid
flowchart TD
    subgraph Client["Client Tier (React 18 + Vite)"]
        UI["Tailwind UI Components"]
        STATE["FitnessContext (React Context)"]
        CLIENT["ApiClient (Fetch API + Token Interceptor)"]
    end

    subgraph Gateway["Ingress / Reverse Proxy"]
        NGINX["Nginx Production Proxy (:80 / :443)"]
    end

    subgraph Backend["Application Tier (FastAPI + Python 3.11)"]
        ROUTER["API Version 1 Router (/api/v1)"]
        AUTH["Auth & Rate Limiter (SlowAPI + Bcrypt)"]
        NLP["Deterministic NLP Engine (Regex Normalizer)"]
        SCIENCE["Sports Science Service (1RM, Volume, ACWR)"]
        ORM["SQLAlchemy 2.0 (Sync Engine + Pooling)"]
    end

    subgraph DataTier["Persistence Tier (Microsoft SQL Server 2022)"]
        SQL["SQL Server Engine (MyFitSyncDB)"]
        TABLES[("Users, Workouts, Nutrition, DailyReadiness")]
    end

    UI --> STATE
    STATE --> CLIENT
    CLIENT --> NGINX
    NGINX -->|/api/*| ROUTER
    NGINX -->|/*| UI
    ROUTER --> AUTH
    ROUTER --> NLP
    NLP --> SCIENCE
    SCIENCE --> ORM
    ORM -->|ODBC Driver 18| SQL
    SQL --> TABLES
```

---

## 2. Multi-Intent NLP Pipeline Sequence

When an athlete types natural language (e.g. `"Squats 100 kg 5 reps 3 sets at RPE 8, ate 2200 kcal with 160 g protein, slept 7 hours"`), the request is processed through a deterministic multi-stage pipeline:

```mermaid
sequenceDiagram
    autonumber
    actor Athlete as Athlete (User)
    participant ChatUI as Chat Interface
    participant API as FastAPI /api/v1/chat
    participant NLP as DeterministicNLPParser
    participant Science as Sports Science Engine
    participant DB as SQL Server 2022

    Athlete->>ChatUI: Submits plain English log
    ChatUI->>API: POST /chat (with X-Idempotency-Key & JWT)
    API->>API: Check Idempotency Cache
    alt Key Found in Cache
        API-->>ChatUI: Return cached JSON response (No duplicate DB rows)
    else Key New
        API->>NLP: parse(message, timezone)
        NLP->>NLP: Normalize tokens & unit conversions (lb -> kg)
        NLP->>NLP: Segment clauses by conjunctions & punctuation
        NLP->>NLP: Resolve exercise aliases via JSON dictionary
        NLP->>Science: Compute Volume (kg * reps * sets)
        NLP->>Science: Compute Brzycki / Wathan Estimated 1RM
        NLP->>Science: Check Atwater Macro Consistency (4/4/9)
        NLP->>DB: Begin Transaction: Insert Workouts, Nutrition, Readiness
        DB-->>API: Transaction Committed (Generated IDs)
        API->>API: Store response in Idempotency Cache
        API-->>ChatUI: Return structured entities & friendly confirmation
    end
    ChatUI-->>Athlete: Displays confirmed entity cards & clarification chips
```

---

## 3. Acute:Chronic Workload Ratio (ACWR) Calculation Flow

The ACWR engine quantifies training fatigue and load spikes by comparing 7-day acute volume to 28-day chronic volume using rolling daily averages:

```mermaid
flowchart LR
    subgraph DataInput["Verified Historical Records"]
        W1["Past 28 Days Workouts"]
    end

    subgraph Aggregation["Daily Volume Aggregation"]
        D1["Daily Volume per Calendar Day"]
    end

    subgraph Windows["Rolling Averages"]
        ACUTE["Acute Load (7 Days)<br/>Sum(Vol_7d) / 7.0"]
        CHRONIC["Chronic Load (28 Days)<br/>Sum(Vol_28d) / 28.0"]
    end

    subgraph SafetyGate["History Guard & Zero Check"]
        GUARD{"History >= 14 days<br/>AND Chronic Load > 0?"}
    end

    subgraph Classification["Zone Categorization"]
        OPT["Optimal Load (0.8 - 1.3)"]
        UNDER["Underreaching (< 0.8)"]
        ELEV["Elevated Fatigue (1.3 - 1.5)"]
        OVER["Overreaching (> 1.5)"]
    end

    W1 --> D1
    D1 --> ACUTE
    D1 --> CHRONIC
    ACUTE --> GUARD
    CHRONIC --> GUARD
    GUARD -- "No (<14d)" --> INSUF["Insufficient Data Status<br/>(Building Baseline)"]
    GUARD -- "Yes (>=14d)" --> RATIO["Ratio = Acute / Chronic"]
    RATIO --> OPT
    RATIO --> UNDER
    RATIO --> ELEV
    RATIO --> OVER
```

> [!IMPORTANT]
> **Mandatory Clinical Disclaimer:** The Acute:Chronic Workload Ratio is an evidence-based training load monitoring metric, not a clinical diagnostic tool or medical predictor. It is presented with a non-dismissible guidance disclaimer across all views.

---

## 4. Database Schema & Entity-Relationship Diagram

MyFitSync enforces strict referential integrity, check constraints, nonclustered indexes, and `ON DELETE CASCADE` inside Microsoft SQL Server 2022:

```mermaid
erDiagram
    USERS ||--o{ WORKOUTS : "logs"
    USERS ||--o{ NUTRITION : "logs"
    USERS ||--o{ DAILY_READINESS : "logs"

    USERS {
        nvarchar(36) user_id PK "UUID String (Enforces enumeration resistance)"
        nvarchar(255) email UK "Indexed unique athlete email"
        nvarchar(255) hashed_password "Bcrypt hashed password"
        nvarchar(100) name "Athlete full name"
        float bodyweight_kg "Default 75.0, strictly positive"
        int target_calories "Default 2500, strictly positive"
        float target_protein_g "Optional macro target"
        float target_carbs_g "Optional macro target"
        float target_fat_g "Optional macro target"
        nvarchar(50) timezone "Default UTC"
        datetime2 created_at "UTC timestamp"
        datetime2 updated_at "UTC timestamp"
    }

    WORKOUTS {
        int id PK "Identity Autoincrement"
        nvarchar(36) user_id FK "References USERS.user_id (ON DELETE CASCADE)"
        nvarchar(100) exercise "Normalized exercise key (e.g. bench_press)"
        nvarchar(255) exercise_raw "Original phrase typed by athlete"
        float weight_kg "Lift weight (>= 0)"
        int reps "Repetitions (> 0)"
        int sets "Sets (> 0)"
        float rpe "Rating of Perceived Exertion (1.0 - 10.0)"
        float estimated_1rm "Brzycki/Wathan 1RM (Null if reps > 12)"
        float total_volume "weight_kg * reps * sets"
        date performed_on "Training calendar date"
        datetime2 created_at "UTC timestamp"
    }

    NUTRITION {
        int id PK "Identity Autoincrement"
        nvarchar(36) user_id FK "References USERS.user_id (ON DELETE CASCADE)"
        nvarchar(255) meal_title "Meal description or title"
        float calories "Total calories (>= 0)"
        float protein_g "Protein in grams (>= 0)"
        float carbs_g "Carbohydrates in grams (>= 0)"
        float fat_g "Fat in grams (>= 0)"
        date eaten_on "Consumption date"
        datetime2 created_at "UTC timestamp"
    }

    DAILY_READINESS {
        int id PK "Identity Autoincrement"
        nvarchar(36) user_id FK "References USERS.user_id (ON DELETE CASCADE)"
        float sleep_hours "Sleep duration (0.0 - 24.0)"
        float soreness_score "Soreness rating (1.0 - 10.0)"
        int resting_hr "Resting heart rate (1 - 249 bpm)"
        date logged_date "Daily log date (Unique per user+date)"
        datetime2 created_at "UTC timestamp"
    }
```

---

## 5. Security & Multi-Tenant Data Isolation

MyFitSync implements defense-in-depth isolation across all operational layers:
1. **Enumeration Resistance:** All User IDs are random RFC 4122 v4 UUIDs (`String(36)`), eliminating sequential ID guessing attacks.
2. **Strict 404 on Foreign Resources:** Any attempt by an authenticated user to query, mutate, or delete a resource belonging to another user returns a strict **HTTP 404 Not Found** (never 403 Forbidden), preventing attackers from inferring the existence of other users' records.
3. **Database Check Constraints:** Data bounds (e.g. `reps > 0`, `weight_kg >= 0`, `sleep_hours BETWEEN 0 AND 24`) are enforced at both the Pydantic schema level and the database table level.
4. **Least Privilege Database Login:** The application connects exclusively as `myfitsync_app`, granted only `db_datareader` and `db_datawriter` on `MyFitSyncDB`—with zero permissions on `master` or server-level administrative privileges.
5. **Rate Limiting & Lockout:** SlowAPI protects endpoints from brute force, and an automatic failed-login tracker locks accounts for 15 minutes after 5 consecutive failures.
