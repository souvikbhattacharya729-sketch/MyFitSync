# Disaster Recovery and Business Continuity Plan

## 1. Objectives & Metrics
- **RPO (Recovery Point Objective):** $\le$ 1 hour. Maximum acceptable data loss window. Achieved through scheduled automated backups and transaction log archival.
- **RTO (Recovery Time Objective):** $\le$ 30 minutes. Maximum acceptable application downtime during a disaster recovery scenario.

---

## 2. Backup Strategy & Schedule

| Backup Type | Frequency | Retention | Storage Location |
|---|---|---|---|
| **Full Database Backup** | Daily at 02:00 UTC | 30 days | `/var/opt/mssql/backup` + Encrypted S3/Blob Object Storage |
| **Differential Backup** | Every 4 hours | 7 days | `/var/opt/mssql/backup` + Encrypted S3/Blob Object Storage |
| **Transaction Log Backup** | Every 15 minutes | 48 hours | `/var/opt/mssql/backup` + Encrypted S3/Blob Object Storage |

---

## 3. Automated Backup Script Execution
Backups are triggered via `scripts/backup_db.sh`:
```bash
# Execute within container sql1
docker exec -t sql1 /var/opt/mssql/backup/backup_db.sh
# Or from host:
BACKUP_DIR="./backups" ./scripts/backup_db.sh
```

---

## 4. Step-by-Step Restoration Procedure
In the event of database corruption or hardware failure:

1. **Stop Application Backend:**
   ```bash
   docker compose stop backend
   ```
2. **Identify Target Backup:**
   Locate the latest verified `.bak` file in the backup directory or retrieve it from offsite encrypted storage.
3. **Execute Restore:**
   ```bash
   ./scripts/restore_db.sh /var/opt/mssql/backup/MyFitSyncDB_YYYYMMDD_HHMMSS.bak
   ```
   The restore script immediately drops existing active sessions (`SET SINGLE_USER WITH ROLLBACK IMMEDIATE`), restores the database with `REPLACE`, and resets the database to `MULTI_USER`.
4. **Run Database Integrity Check:**
   ```bash
   docker exec -it sql1 /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C \
       -Q "DBCC CHECKDB ('MyFitSyncDB') WITH NO_INFOMSGS, ALL_ERRORMSGS;"
   ```
5. **Restart Backend and Run Health Checks:**
   ```bash
   docker compose start backend
   curl -f http://localhost:8000/api/v1/health/ready
   ```

---

## 5. Rollback Procedures
If an application deployment or schema migration introduces breaking errors:
1. **Application Code Rollback:** Revert backend and frontend containers to the previous stable release tag via Docker Compose (`docker compose -f docker/docker-compose.prod.yml up -d`).
2. **Database Migration Downgrade:** If schema changes are reversible without data loss, run `alembic downgrade -1`. If destructive schema mutations occurred, restore the pre-deployment full backup using the procedure in Section 4.
