#!/usr/bin/env bash
set -euo pipefail

# PostgreSQL & Supabase Database Backup Script for MyFitSync
# Supports local PostgreSQL, Docker container, and remote Supabase instances.

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_DIR:-backups}"
BACKUP_FILENAME="myfitsync_backup_${TIMESTAMP}.dump"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

mkdir -p "${BACKUP_DIR}"

echo "=========================================="
echo "MyFitSync PostgreSQL Database Backup"
echo "Timestamp:   ${TIMESTAMP}"
echo "Target File: ${BACKUP_PATH}"
echo "=========================================="

# Check if DATABASE_URL is set (e.g. Supabase connection)
if [ -n "${DATABASE_URL:-}" ]; then
    echo "Backing up via DATABASE_URL..."
    pg_dump -Fc --no-owner --no-privileges -d "${DATABASE_URL}" -f "${BACKUP_PATH}"
elif docker ps --format '{{.Names}}' | grep -q "^myfitsync_postgres$"; then
    echo "Backing up from local Docker container 'myfitsync_postgres'..."
    docker exec myfitsync_postgres pg_dump -U postgres -Fc --no-owner --no-privileges myfitsync > "${BACKUP_PATH}"
else
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-5432}"
    DB_USER="${DB_USER:-postgres}"
    DB_NAME="${DB_NAME:-myfitsync}"
    export PGPASSWORD="${DB_PASSWORD:-postgres}"
    echo "Backing up from ${DB_HOST}:${DB_PORT}/${DB_NAME}..."
    pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -Fc --no-owner --no-privileges -d "${DB_NAME}" -f "${BACKUP_PATH}"
fi

echo "✓ PostgreSQL backup completed successfully: ${BACKUP_PATH}"
