# MyFitSync Production Deployment Guide

This guide details the procedure for deploying **MyFitSync ("Your Personal Fitness Intelligence")** into high-availability production environments.

---

## 1. System Requirements

| Component | Minimum Specification | Recommended Production |
|---|---|---|
| **CPU** | 2 vCPUs (x86_64 or arm64 with Rosetta/AVX) | 4 vCPUs |
| **RAM** | 4 GB | 8 GB (MS SQL Server requires 2 GB min) |
| **Disk Storage** | 20 GB SSD | 50 GB NVMe SSD |
| **Operating System** | Ubuntu 22.04 LTS / Debian 12 / RHEL 9 | Ubuntu 22.04 LTS |
| **Container Engine** | Docker Engine 24.0+ & Compose v2.20+ | Latest Stable Docker CE |

---

## 2. Secrets Management & Environment Configuration

Copy the template environment file to `.env`:
```bash
cp .env.example .env
chmod 600 .env
```

### Mandatory Production Secrets
Edit `.env` and configure strong, unique secrets:
```env
# Microsoft SQL Server Passwords (Min 8 chars, uppercase, lowercase, number, symbol)
MSSQL_SA_PASSWORD=SuperStr0ng_Pr0d_SA_Passw0rd_2026!
APP_DB_PASSWORD=Secure_App_Db_User_Passw0rd_2026!

# Application JWT Secret (Strictly enforced: >= 32 characters, non-default)
SECRET_KEY=prod_jwt_signing_secret_key_minimum_32_characters_mandatory!
ENVIRONMENT=production

# Token Expiry & CORS
ACCESS_TOKEN_EXPIRE_MINUTES=60
ALLOWED_ORIGINS=https://myfitsync.example.com
```

> [!CAUTION]
> The backend startup lifecycle automatically inspects `SECRET_KEY` and `ENVIRONMENT`. If `ENVIRONMENT=production` and `SECRET_KEY` is under 32 characters or contains default testing tokens, the process immediately aborts with a fatal configuration error.

---

## 3. Network Architecture & Port Exposure

Per Section 10 & 12 of the Master Specification:
- **Port 1433 (SQL Server):** **NEVER published to the host or internet** in `docker-compose.prod.yml`. It is accessible exclusively through the internal Docker bridge network (`docker_default`) to the backend container.
- **Port 8000 (Backend API):** Internal only; exposed exclusively to the frontend Nginx reverse proxy.
- **Port 80 / 443 (Web Gateway):** Published for athlete web traffic. Nginx handles SSL/TLS termination and reverse proxies `/api/` requests to `http://backend:8000/api/`.

---

## 4. Production Deployment Execution

### Step 1: Build Production Images
```bash
docker compose -f docker/docker-compose.prod.yml build
```

### Step 2: Launch Stack
```bash
docker compose -f docker/docker-compose.prod.yml up -d
```

### Step 3: Execute Database Migrations
Run Alembic migrations to apply all schema tables, check constraints, and nonclustered indexes to `MyFitSyncDB`:
```bash
docker compose -f docker/docker-compose.prod.yml exec backend alembic upgrade head
```

### Step 4: Verify Deployment Health
Verify that the database and API are healthy:
```bash
curl -f http://localhost/api/v1/health/ready
```
Expected output:
```json
{"status":"ready","database":"connected"}
```

---

## 5. Automated Backups & Disaster Recovery

### Creating a Snapshot Backup
Execute the automated backup utility (stored in `backups/`):
```bash
./scripts/backup_db.sh
```

### Restoring from Backup
To recover from an outage or data corruption event:
```bash
./scripts/restore_db.sh backups/MyFitSyncDB_backup_YYYYMMDD_HHMMSS.bak
```
See [`docs/DISASTER_RECOVERY.md`](file:///Users/souvikbhattacharya/Desktop/MyFitSync/docs/DISASTER_RECOVERY.md) for recovery time objective (RTO) and point objective (RPO) SLAs.
