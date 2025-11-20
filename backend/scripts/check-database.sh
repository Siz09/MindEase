#!/bin/bash
# Quick database connectivity check

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-mindease}
DB_USER=${DB_USER:-mindease}
DB_PASSWORD=${DB_PASSWORD:-secret}

echo "🔍 Checking database connection..."
echo "  Host: ${DB_HOST}"
echo "  Port: ${DB_PORT}"
echo "  Database: ${DB_NAME}"
echo "  User: ${DB_USER}"
echo ""

if command -v psql >/dev/null 2>&1; then
    if PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT version();" 2>&1; then
        echo ""
        echo "✅ Database connection successful!"
        echo ""
        echo "Checking required tables..."
        TABLES=("users" "mood_entries" "journal_entries" "subscriptions" "audit_logs" "notifications" "messages" "chat_sessions")
        for table in "${TABLES[@]}"; do
            if PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '${table}');" | grep -q t; then
                echo "  ✅ ${table}"
            else
                echo "  ⚠️  ${table} (not found - run Flyway migrations)"
            fi
        done
        exit 0
    else
        echo "❌ Database connection failed"
        echo ""
        echo "Troubleshooting:"
        echo "  1. Is PostgreSQL running?"
        echo "     - Docker: cd backend/docker && docker-compose up -d"
        echo "     - Manual: sudo systemctl start postgresql"
        echo "  2. Are credentials correct? (check application.yml)"
        echo "  3. Is port 5432 accessible?"
        exit 1
    fi
else
    echo "⚠️  psql not found - cannot test database connection"
    echo "   Install PostgreSQL client or use Docker"
    exit 1
fi
