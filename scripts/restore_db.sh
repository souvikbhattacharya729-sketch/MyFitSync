#!/usr/bin/env bash
set -euo pipefail

# Database Restore Script for MyFitSyncDB
# Restores MyFitSyncDB from a specified .bak file with REPLACE

if [ $# -lt 1 ]; then
    echo "Usage: $0 <path_to_backup_file.bak>"
    echo "Example: $0 /var/opt/mssql/backup/MyFitSyncDB_20261109_120000.bak"
    exit 1
fi

BACKUP_FILE="$1"
SQL_SERVER="${SQL_SERVER:-localhost}"
SQL_USER="${SQL_USER:-sa}"
SQL_PASSWORD="${MSSQL_SA_PASSWORD:-Password123!}"
SQLCMD_BIN="${SQLCMD_BIN:-/opt/mssql-tools18/bin/sqlcmd}"

if [ ! -f "$SQLCMD_BIN" ]; then
    SQLCMD_BIN="/opt/mssql-tools/bin/sqlcmd"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file does not exist at '${BACKUP_FILE}'"
    exit 1
fi

echo "=========================================="
echo "MyFitSync Database Restore"
echo "Source File: ${BACKUP_FILE}"
echo "Target DB:   MyFitSyncDB"
echo "=========================================="

# Terminate active connections and restore database
"$SQLCMD_BIN" -S "${SQL_SERVER}" -U "${SQL_USER}" -P "${SQL_PASSWORD}" -C \
    -Q "
ALTER DATABASE [MyFitSyncDB] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
RESTORE DATABASE [MyFitSyncDB] FROM DISK = N'${BACKUP_FILE}' WITH REPLACE;
ALTER DATABASE [MyFitSyncDB] SET MULTI_USER;
"

echo "Database MyFitSyncDB restored successfully from ${BACKUP_FILE}."
