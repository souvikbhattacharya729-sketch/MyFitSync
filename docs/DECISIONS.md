# Architecture Decision Records (ADRs)

## ADR-001: User Primary Key Strategy (UUID vs BIGINT)
- **Status:** Accepted
- **Context:** The specification allows selecting either UUID (`UNIQUEIDENTIFIER`) or `BIGINT IDENTITY` for `users.user_id`, provided it is used consistently everywhere.
- **Decision:** Use UUID (`UNIQUEIDENTIFIER` in MS SQL Server, `uuid.UUID` in Python/Pydantic/SQLAlchemy).
- **Alternatives Considered:** `BIGINT IDENTITY`.
- **Reason:** UUIDs prevent ID enumeration attacks, allow client-side or distributed ID generation without round-trips, avoid data leaks across multi-tenant boundaries, and are industry standard for user identity in secure cloud applications.

---

## ADR-002: Database Driver and Session Execution Model
- **Status:** Accepted
- **Context:** The database is Microsoft SQL Server 2022. Python has `pyodbc` with Microsoft ODBC Driver 18, which is synchronous. An async driver (`aioodbc`) is also possible but often suffers from connection pool stability issues and platform-specific quirks with FreeTDS/ODBC.
- **Decision:** Use `pyodbc` with synchronous SQLAlchemy 2.0 sessions (`Session`, `sessionmaker`) paired with FastAPI synchronous path operation functions (`def endpoint(...)` instead of `async def endpoint(...)`).
- **Alternatives Considered:** `aioodbc` with SQLAlchemy `create_async_engine`.
- **Reason:** FastAPI automatically executes regular synchronous `def` endpoints inside an external worker threadpool (`anyio.to_thread.run_sync`), preventing blocking of the main asyncio event loop while utilizing the battle-tested, official Microsoft ODBC Driver 18 without driver instabilities or async dialect edge cases.

---

## ADR-003: Primary 1RM Formula and Rep Limit
- **Status:** Accepted
- **Context:** Need to select the primary E1RM formula for storage and trends, and handle high rep sets.
- **Decision:** Use Brzycki (`E1RM = W * 36 / (37 - reps)`) as the primary estimated 1RM formula for reps 1 to 10. Compute Wathan (`E1RM = 100 * W / (48.8 + 53.8 * e^(-0.075 * reps))`) as a secondary metric for comparison. For sets with reps > 12, store `estimated_1rm = None` (null) and emit a warning because submaximal 1RM estimation formulas degrade significantly in validity above 10-12 repetitions. Sets with reps >= 37 are strictly rejected to avoid zero/negative division.
- **Alternatives Considered:** Epley, Lombardi, O'Conner.
- **Reason:** Brzycki is the gold standard for strength sports research under 10 reps, and explicitly capping estimation at reps <= 12 maintains scientific accuracy.

---

## ADR-004: Training Load and Rolling-Average ACWR Calculation
- **Status:** Accepted
- **Context:** Acute:Chronic Workload Ratio (ACWR) requires defining daily training load, acute window (7 days), chronic window (28 days), and handling edge cases like 0 chronic load or insufficient historical data.
- **Decision:** Daily training load defaults to total daily training volume (`sum(weight_kg * reps * sets)`), or session RPE load (`RPE * duration_minutes`) if duration is provided. Method: rolling-average ACWR (acute 7-day average load / chronic 28-day average load). If chronic load is 0 or history is under 14 days, ACWR returns `null` with status `insufficient_data`. Descriptors are attached (`underreaching` <0.8, `optimal` 0.8-1.3, `high` 1.3-1.5, `overreaching` >1.5), along with a prominent disclaimer stating ACWR is an informational metric, not a validated medical injury predictor.
- **Alternatives Considered:** Exponentially Weighted Moving Average (EWMA).
- **Reason:** Rolling average is transparent, reproducible, and complies directly with Section 8 specification guidelines.

---

## ADR-005: Frontend Token Storage Strategy
- **Status:** Accepted
- **Context:** Need to store JWT access tokens across page reloads and protect against unauthorized access.
- **Decision:** Token is kept in React Context (`FitnessContext`) in-memory for active sessions, and synced with `localStorage` (or `sessionStorage` based on user "remember me" choice, defaulting to `localStorage`) to allow seamless navigation across browser tabs and page reloads. The single API client (`services/api.js`) automatically intercepts 401 responses, clears storage, and triggers logout.
- **Alternatives Considered:** httpOnly cookies.
- **Reason:** In a decoupled frontend/backend setup deployed via separate containers or CDN/API domains, local token management avoids cross-domain cookie and CSRF complexities while maintaining rapid responsiveness and clear token expiry handling.
