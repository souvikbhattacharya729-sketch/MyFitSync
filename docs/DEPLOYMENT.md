# MyFitSync Production Deployment Guide

This guide details the procedure for deploying **MyFitSync ("Your Personal Fitness Intelligence")** into high-availability production environments.

---

## 1. System Requirements

| Component | Minimum Specification | Recommended Production |
|---|---|---|
| **CPU** | 1 vCPU (x86_64 or arm64 native) | 2–4 vCPUs |
| **RAM** | 512 MB (PostgreSQL is lightweight) | 2–4 GB |
| **Disk Storage** | 10 GB SSD | 30 GB NVMe SSD |
| **Operating System** | Ubuntu 22.04 LTS / Debian 12 / Alpine Linux | Ubuntu 22.04 LTS |
| **Container Engine** | Docker Engine 24.0+ & Compose v2.20+ | Latest Stable Docker CE |

---

## 2. Secrets Management & Environment Configuration

Copy the template environment file to `.env`:
```bash
cp .env.example .env
chmod 600 .env
```

### Mandatory Production Secrets
Configure strong, unique secrets in your `.env` or cloud secret manager:
```env
# Application Environment
ENVIRONMENT=production

# Supabase / PostgreSQL Connection
# For direct connection:
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
# Or for transaction pooler (recommended on Render):
# DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
DB_SSLMODE=require

# Application Cryptographic HMAC Key (Strictly enforced: >= 32 characters)
SECRET_KEY=prod_jwt_signing_secret_key_minimum_32_characters_mandatory!

# Token Expiry & CORS
ACCESS_TOKEN_EXPIRE_MINUTES=60
ALLOWED_ORIGINS=https://myfitsync.vercel.app,https://your-custom-domain.com
```

> [!CAUTION]
> The backend startup lifecycle automatically inspects `SECRET_KEY` and `ENVIRONMENT`. If `ENVIRONMENT=production` and `SECRET_KEY` is under 32 characters or contains default testing tokens, the process immediately aborts with a fatal configuration error.

---

## 3. Production Deployment Options

### Option A: Cloud Native (Supabase + Render + Vercel) — Recommended
Follow the dedicated step-by-step setup in [`docs/SUPABASE_RENDER_VERCEL.md`](file:///Users/souvikbhattacharya/Desktop/MyFitSync/docs/SUPABASE_RENDER_VERCEL.md):
- **Database:** Supabase PostgreSQL 16 (SSL enabled, automated cloud backups)
- **Backend:** Render Web Service (FastAPI / Uvicorn with `render.yaml`)
- **Frontend:** Vercel SPA (React 18 / Vite with `frontend/vercel.json`)

### Option B: Self-Hosted Docker Compose Production Stack
If deploying to a single virtual server (e.g. AWS EC2, DigitalOcean Droplet, Hetzner):
1. Build production images:
   ```bash
   docker compose -f docker/docker-compose.prod.yml build
   ```
2. Launch the stack:
   ```bash
   docker compose -f docker/docker-compose.prod.yml up -d
   ```
3. Run Alembic migrations:
   ```bash
   docker compose -f docker/docker-compose.prod.yml exec backend alembic upgrade head
   ```
4. Verify deployment health:
   ```bash
   curl -f http://localhost/api/v1/health/ready
   ```
   Expected response:
   ```json
   {"status":"ready","database":"connected"}
   ```

---

## 4. Automated Backups & Disaster Recovery

### Creating a Snapshot Backup (`pg_dump`)
Execute the automated backup utility:
```bash
./scripts/backup_db.sh
```
This produces a compressed PostgreSQL custom-format dump in `backups/myfitsync_backup_YYYYMMDD_HHMMSS.dump`.

### Restoring from Backup (`pg_restore`)
To recover from an incident or perform a point-in-time recovery:
```bash
./scripts/restore_db.sh backups/myfitsync_backup_YYYYMMDD_HHMMSS.dump
```
See [`docs/DISASTER_RECOVERY.md`](file:///Users/souvikbhattacharya/Desktop/MyFitSync/docs/DISASTER_RECOVERY.md) for full RTO/RPO SLA protocols.
