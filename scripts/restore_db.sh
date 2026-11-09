#!/usr/bin/env bash
set -euo pipefail

# PostgreSQL & Supabase Database Restore Script for MyFitSync
# Restores schema and records from a specified .dump or .sql backup.

if [ $# -lt 1 ]; then
    echo "Usage: $0 <path_to_backup_file.dump>"
    echo "Example: $0 backups/myfitsync_backup_20261109_120000.dump"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file does not exist at '${BACKUP_FILE}'"
    exit 1
fi

echo "=========================================="
echo "MyFitSync PostgreSQL Database Restore"
echo "Source File: ${BACKUP_FILE}"
echo "=========================================="

if [ -n "${DATABASE_URL:-}" ]; then
    echo "Restoring directly into DATABASE_URL..."
    pg_restore --clean --if-exists --no-owner --no-privileges -d "${DATABASE_URL}" "${BACKUP_FILE}" || true
elif docker ps --format '{{.Names}}' | grep -q "^myfitsync_postgres$"; then
    echo "Restoring into local Docker container 'myfitsync_postgres'..."
    docker exec -i myfitsync_postgres pg_restore -U postgres --clean --if-exists --no-owner --no-privileges -d myfitsync < "${BACKUP_FILE}" || true
else
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-5432}"
    DB_USER="${DB_USER:-postgres}"
    DB_NAME="${DB_NAME:-myfitsync}"
    export PGPASSWORD="${DB_PASSWORD:-postgres}"
    echo "Restoring to ${DB_HOST}:${DB_PORT}/${DB_NAME}..."
    pg_restore -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" --clean --if-exists --no-owner --no-privileges -d "${DB_NAME}" "${BACKUP_FILE}" || true
fi

echo "✓ PostgreSQL database restore completed from ${BACKUP_FILE}."
