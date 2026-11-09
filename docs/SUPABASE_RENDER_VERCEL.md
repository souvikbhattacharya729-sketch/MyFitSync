# MyFitSync: Supabase, Render & Vercel Production Integration Guide

This guide provides the exact, production-ready steps to deploy **MyFitSync ("Your Personal Fitness Intelligence")** using:
- **Database:** Supabase-hosted PostgreSQL 16
- **Backend API:** Render (FastAPI / Python 3.11)
- **Frontend SPA:** Vercel (React 18 / Vite)

---

## 1. Supabase PostgreSQL Setup

### Step 1.1: Create Supabase Project
1. Log in to [Supabase](https://supabase.com) and navigate to the Dashboard.
2. Click **New project** and select an organization.
3. Configure project settings:
   - **Name:** `MyFitSync-Prod` (or your preferred name)
   - **Database Password:** Generate a secure, high-entropy password (store this in your password manager).
   - **Region:** Choose a region geographically close to your Render deployment (e.g., `us-east-1` AWS North Virginia).
   - **Pricing Plan:** Free tier or Pro.
4. Click **Create new project** and wait 1–2 minutes for database provisioning.

### Step 1.2: Retrieve Connection Strings
In your Supabase project dashboard, navigate to **Project Settings** > **Database**:

1. **Direct Connection (Session Mode - Port 5432):**
   ```text
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
   ```
   *Recommended for running Alembic migrations or persistent servers.*

2. **Supavisor Connection Pooler (Transaction Mode - Port 6543):**
   ```text
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
   ```
   *Recommended for scalable production backend deployments on Render to prevent connection exhaustion.*

> [!IMPORTANT]
> - Always include `?sslmode=require` or set `DB_SSLMODE=require`. Supabase rejects unencrypted connections.
> - MyFitSync's backend automatically normalizes both `postgres://` and `postgresql://` URIs and handles `sslmode=require`.
> - Engine pooling is pre-configured with `pool_pre_ping=True` and `pool_recycle=300` to prevent drops across Supabase's cloud firewalls.

### Step 1.3: Apply Database Migrations to Supabase
Run Alembic migrations directly from your local terminal to provision the tables, check constraints, and nonclustered indexes in Supabase:
```bash
# Export your Supabase connection string
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
export DB_SSLMODE="require"

# Navigate to backend and run migrations
cd backend
alembic upgrade head
```

Verify in Supabase Table Editor that the following tables exist:
- `users`
- `workouts`
- `nutrition`
- `daily_readiness`
- `alembic_version`

---

## 2. Render Backend Deployment

Render hosts the FastAPI service with automatic HTTPS, continuous deployment from GitHub, and health checks.

### Option A: Deploy via `render.yaml` Blueprint (Recommended)
The repository includes a root `render.yaml` specification:
1. Log in to [Render](https://render.com).
2. Go to **Blueprints** and click **New Blueprint Instance**.
3. Connect your GitHub repository (`MyFitSync`).
4. Render will parse `render.yaml` and prompt for the environment variables.
5. Click **Apply**.

### Option B: Manual Web Service Setup
1. In the Render Dashboard, click **New +** > **Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Name:** `myfitsync-backend`
   - **Region:** Same region as Supabase (e.g., Oregon or Ohio / Virginia)
   - **Branch:** `main`
   - **Root Directory:** *(leave blank or set to backend)*
   - **Runtime:** `Python 3` (or `Docker` pointing to `backend/Dockerfile`)
   - **Build Command:**
     ```bash
     pip install --upgrade pip && pip install -r backend/requirements.txt && cd backend && alembic upgrade head
     ```
   - **Start Command:**
     ```bash
     cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2
     ```
   - **Plan:** Free or Starter

4. Configure **Environment Variables** in Render:
   | Key | Value / Example | Notes |
   |---|---|---|
   | `ENVIRONMENT` | `production` | Enables production security checks |
   | `DATABASE_URL` | `postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require` | Use Supabase connection pooler |
   | `DB_SSLMODE` | `require` | Enforces SSL for Supabase |
   | `SECRET_KEY` | *(Generate a 64-char random hex)* | `python3 -c "import secrets; print(secrets.token_hex(32))"` |
   | `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | JWT expiration |
   | `ALLOWED_ORIGINS` | `https://myfitsync.vercel.app,https://your-custom-domain.com` | Your Vercel frontend URL |

5. Configure **Health Check Path**:
   - Set **Health Check Path** to `/api/v1/health/ready`.
   - Render will verify database connectivity before routing incoming traffic.

---

## 3. Vercel Frontend Deployment

Vercel provides edge delivery for the React 18 / Vite single-page application.

### Step 3.1: Import Project to Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Import your `MyFitSync` GitHub repository.

### Step 3.2: Configure Project Settings
- **Project Name:** `myfitsync`
- **Framework Preset:** `Vite`
- **Root Directory:** Click **Edit** and select `frontend`
- **Build Command:** `npm run build` (default)
- **Output Directory:** `dist` (default)
- **Install Command:** `npm install` (default)

### Step 3.3: Set Environment Variables in Vercel
Under the **Environment Variables** section, add:
| Key | Value | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `https://myfitsync-backend.onrender.com/api/v1` | URL to your Render backend API v1 |

> [!CAUTION]
> Never put database URLs, database passwords, or JWT secrets in Vercel. Vite variables prefixed with `VITE_` are publicly embedded in client-side bundles.

### Step 3.4: SPA Routing Support
The repository includes `frontend/vercel.json` configured with:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
This ensures React Router routes (`/dashboard`, `/chat`, `/analytics`, `/login`, `/register`) reload properly without 404 errors.

4. Click **Deploy**. Vercel will build and publish your frontend to a `https://*.vercel.app` domain.

---

## 4. Post-Deployment Verification & Smoke Tests

After both services are deployed:

1. **Verify Backend Health:**
   ```bash
   curl -f https://myfitsync-backend.onrender.com/api/v1/health/ready
   ```
   Expected response:
   ```json
   {"status":"ready","database":"connected"}
   ```

2. **Verify CORS Configuration:**
   Ensure `ALLOWED_ORIGINS` in Render matches your Vercel URL (e.g. `https://myfitsync.vercel.app`).

3. **Verify End-to-End User Flow:**
   - Open your Vercel URL in your browser.
   - Click **Get Started** and register a new athlete account.
   - Log a multi-intent message in the Chat interface:
     ```text
     Squats 100 kg 5 reps 3 sets @ 8, ate 2200 kcal with 160g protein, slept 7.5 hours
     ```
   - Check the **Dashboard** and **Analytics** tabs to verify that training volume, estimated 1RM, calories, and ACWR calculate accurately in real time from Supabase.
