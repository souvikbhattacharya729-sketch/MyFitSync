#!/usr/bin/env bash
set -euo pipefail

# Database Backup Script for MyFitSyncDB
# Supports running directly inside the container or from host via docker exec

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_DIR:-/var/opt/mssql/backup}"
BACKUP_FILENAME="MyFitSyncDB_${TIMESTAMP}.bak"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

SQL_SERVER="${SQL_SERVER:-localhost}"
SQL_USER="${SQL_USER:-sa}"
SQL_PASSWORD="${MSSQL_SA_PASSWORD:-Password123!}"
SQLCMD_BIN="${SQLCMD_BIN:-/opt/mssql-tools18/bin/sqlcmd}"

if [ ! -f "$SQLCMD_BIN" ]; then
    SQLCMD_BIN="/opt/mssql-tools/bin/sqlcmd"
fi

echo "=========================================="
echo "MyFitSync Database Backup"
echo "Timestamp: ${TIMESTAMP}"
echo "Target File: ${BACKUP_PATH}"
echo "=========================================="

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

# Execute T-SQL Backup
"$SQLCMD_BIN" -S "${SQL_SERVER}" -U "${SQL_USER}" -P "${SQL_PASSWORD}" -C \
    -Q "BACKUP DATABASE [MyFitSyncDB] TO DISK = N'${BACKUP_PATH}' WITH FORMAT, MEDIANAME = 'MyFitSyncDBBackup', NAME = 'Full Backup of MyFitSyncDB - ${TIMESTAMP}';"

echo "Backup completed successfully: ${BACKUP_PATH}"
