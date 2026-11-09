#!/usr/bin/env bash
set -e

# Path to sqlcmd utility in MS SQL Server 2022
SQLCMD_BIN="/opt/mssql-tools18/bin/sqlcmd"
if [ ! -f "$SQLCMD_BIN" ]; then
    SQLCMD_BIN="/opt/mssql-tools/bin/sqlcmd"
fi

APP_DB_PASSWORD="${APP_DB_PASSWORD:-AppP@ssw0rd2026!}"

# Forward signals to SQL Server
stop_sqlservr() {
    echo "Received shutdown signal. Stopping SQL Server..."
    if [ -n "$SQL_PID" ]; then
        kill -TERM "$SQL_PID"
        wait "$SQL_PID"
    fi
    exit 0
}
trap stop_sqlservr SIGINT SIGTERM

echo "Starting Microsoft SQL Server 2022..."
/opt/mssql/bin/sqlservr &
SQL_PID=$!

echo "Waiting for SQL Server to accept connections..."
MAX_TRIES=60
TRIES=0
READY=0

while [ $TRIES -lt $MAX_TRIES ]; do
    if "$SQLCMD_BIN" -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "SELECT 1" > /dev/null 2>&1; then
        READY=1
        break
    fi
    sleep 2
    TRIES=$((TRIES + 1))
done

if [ $READY -eq 1 ]; then
    echo "SQL Server is ready. Initializing database and least-privilege user..."
    if [ -f "/docker-entrypoint-initdb.d/init-db.sql" ]; then
        "$SQLCMD_BIN" -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C \
            -v APP_DB_PASSWORD="$APP_DB_PASSWORD" \
            -i /docker-entrypoint-initdb.d/init-db.sql
        echo "Database initialization script executed successfully."
    fi
else
    echo "ERROR: Timed out waiting for SQL Server to become ready."
fi

# Keep container running with the main sqlservr process
wait "$SQL_PID"
