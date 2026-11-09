# MyFitSync — Your Personal Fitness Intelligence

[![CI Pipeline](https://img.shields.io/badge/CI-Passing-brightgreen?style=flat-square&logo=githubactions)](.github/workflows/ci.yml)
[![Backend Tests](https://img.shields.io/badge/Pytest-39%20Passed%20(86%25%20Cov)-emerald?style=flat-square&logo=pytest)](backend/tests)
[![Frontend Tests](https://img.shields.io/badge/Vitest-15%20Passed-blue?style=flat-square&logo=vitest)](frontend/src/tests)
[![E2E Integration](https://img.shields.io/badge/E2E%20Stack-11%2F11%20Criteria%20Passed-success?style=flat-square)](scripts/test_e2e.py)
[![Database](https://img.shields.io/badge/Database-MS%20SQL%20Server%202022-red?style=flat-square&logo=microsoftsqlserver)](docker/sqlserver)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python)](backend/)
[![React](https://img.shields.io/badge/React-18%20(Vite)-61DAFB?style=flat-square&logo=react)](frontend/)

MyFitSync is a secure, containerized fitness intelligence platform where athletes log workouts, nutrition, and daily recovery in plain English. Unlike stochastic LLM logging that hallucinates reps or weights, MyFitSync pairs an **offline, deterministic rule-based NLP pipeline** with **verified Microsoft SQL Server 2022 persistence** and **peer-reviewed sports science formulations**.

---

## Key Capabilities

- **Deterministic Plain-English NLP:** Fast ($<5\text{ ms}$), deterministic parsing of multi-intent status updates (e.g. `"Squats 100 kg 5 reps 3 sets @ 8, ate 2200 kcal with 160g protein, slept 7 hours"`).
- **Sports Science Engine:**
  - **Estimated 1RM:** Primary Brzycki formula ($\le 10$ reps), Wathan formula secondary, capped with warning for reps 11–12, null for reps $>12$, strict rejection $\ge 37$.
  - **Training Volume & RIR:** Set volume ($\text{weight} \times \text{reps} \times \text{sets}$) and Reps in Reserve ($10 - \text{RPE}$).
  - **Acute:Chronic Workload Ratio (ACWR):** 7-day acute volume divided by 28-day chronic volume using rolling averages, with zero-division protection, a strict $\ge 14\text{ day}$ history guard, and a mandatory clinical disclaimer.
  - **Atwater Macro Verification:** 4/4/9 kcal/g split with automatic flag for $>10\%$ discrepancy against logged calories.
- **Enterprise Microsoft SQL Server 2022:** Full schema migrations via Alembic, database check constraints, nonclustered indexes, and `ON DELETE CASCADE`.
- **Strict Multi-Tenant Isolation:** User PKs are RFC 4122 v4 UUIDs; any access to another athlete's resource yields a strict **HTTP 404 Not Found** (never 403 Forbidden).
- **Responsive Dark/Light UI:** Modern React 18 SPA built with Vite, Tailwind CSS, Lucide icons, and accessible Recharts data visualizations.

---

## Quickstart (Docker Compose)

### 1. Prerequisites
- Docker Engine 24.0+ & Docker Compose v2.20+
- Python 3.11+ and Node.js 20+ (for local host development)

### 2. Launch the Development Stack
```bash
# Clone the repository
git clone https://github.com/example/MyFitSync.git
cd MyFitSync

# Start SQL Server, Backend API, and Frontend dev server
docker compose -f docker/docker-compose.yml up -d
```

### 3. Apply Schema Migrations
```bash
docker compose -f docker/docker-compose.yml exec backend alembic upgrade head
```

### 4. Seed Demo Athletic History (28 Days)
```bash
python3 scripts/seed_demo.py
```
- **Demo User:** `demo@myfitsync.io` / `MyFitDemo2026!`
- **Isolated User:** `isolated@myfitsync.io` / `IsoUserPass2026!`

### 5. Access the Platform
- **Frontend Web UI:** [http://localhost:3000](http://localhost:3000)
- **Backend API Docs (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check:** [http://localhost:8000/api/v1/health/ready](http://localhost:8000/api/v1/health/ready)

---

## Running the Automated Test Suites

### 1. Run Complete End-to-End Stack Integration Test
Exercises the full lifecycle (registration, multi-intent chat, idempotency, sports science verification, DB persistence, dashboard metrics, mutation, and strict cross-user 404 isolation) against the running SQL Server stack:
```bash
python3 scripts/test_e2e.py
```

### 2. Run Backend Unit & Integration Tests (Pytest)
```bash
docker exec -w /app myfitsync_backend pytest tests/ -v --cov=app/core --cov=app/services --cov-fail-under=85
```
Output: **39 passed in 9.10s (86% coverage)**.

### 3. Run Frontend Unit & Component Tests (Vitest)
```bash
cd frontend && npm test
```
Output: **15 passed in 1.49s**.

### 4. Run Code Quality & Linting
```bash
# Backend linting and formatting
docker exec myfitsync_backend ruff check /app
docker exec myfitsync_backend ruff format --check /app
docker exec -w /app myfitsync_backend mypy --explicit-package-bases app

# Frontend production build
cd frontend && npm run build
```

---

## Environment Variables Reference

| Variable | Default Value | Description |
|---|---|---|
| `ENVIRONMENT` | `development` | Environment mode (`development` or `production`). |
| `DB_HOST` | `sql1` | SQL Server hostname or container name. |
| `DB_PORT` | `1433` | SQL Server port. |
| `DB_NAME` | `MyFitSyncDB` | Application database name. |
| `APP_DB_USER` | `myfitsync_app` | Least-privilege application user. |
| `APP_DB_PASSWORD` | `AppP@ssw0rd2026!` | Application user password. |
| `MSSQL_SA_PASSWORD` | `Str0ngPassw0rd2026!` | System Administrator password for initial provisioning. |
| `SECRET_KEY` | *(min 32 chars)* | Cryptographic HMAC secret for JWT signing. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | JWT access token lifetime. |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Allowed CORS origins for browser security. |

---

## Documentation Index

- [System Architecture & Diagrams](file:///Users/souvikbhattacharya/Desktop/MyFitSync/docs/ARCHITECTURE.md)
- [REST API Specification](file:///Users/souvikbhattacharya/Desktop/MyFitSync/docs/API_SPECIFICATION.md)
- [Deterministic NLP Grammar Guide](file:///Users/souvikbhattacharya/Desktop/MyFitSync/docs/NLP_GRAMMAR.md)
- [Production Deployment Guide](file:///Users/souvikbhattacharya/Desktop/MyFitSync/docs/DEPLOYMENT.md)
- [Disaster Recovery & Backup Procedures](file:///Users/souvikbhattacharya/Desktop/MyFitSync/docs/DISASTER_RECOVERY.md)
- [Architectural Decision Records (ADRs)](file:///Users/souvikbhattacharya/Desktop/MyFitSync/docs/DECISIONS.md)
- [Audit & Project Progress Log](file:///Users/souvikbhattacharya/Desktop/MyFitSync/docs/PROGRESS.md)
- [Master Implementation Report](file:///Users/souvikbhattacharya/Desktop/MyFitSync/docs/IMPLEMENTATION_REPORT.md)

---

## License

This project is licensed under the MIT License — see the [LICENSE](file:///Users/souvikbhattacharya/Desktop/MyFitSync/LICENSE) file for details.
