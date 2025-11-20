#!/bin/bash
# Fix Flyway migration checksum mismatch
# This script repairs the Flyway schema history table to match the current migration files

echo "🔧 Fixing Flyway checksum mismatch..."

# Set database connection details (update if needed)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-mindease}"
DB_USER="${DB_USER:-mindease}"
DB_PASSWORD="${DB_PASSWORD:-secret}"

echo "Connecting to database: ${DB_NAME} on ${DB_HOST}:${DB_PORT}"

# Run Flyway repair
mvn flyway:repair -Dflyway.url=jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME} \
                  -Dflyway.user=${DB_USER} \
                  -Dflyway.password=${DB_PASSWORD}

if [ $? -eq 0 ]; then
    echo "✅ Flyway checksum repair completed successfully!"
    echo "You can now start the backend application."
else
    echo "❌ Flyway repair failed. Please check the error messages above."
    echo ""
    echo "Alternative: Manually update the checksum in the database:"
    echo "  UPDATE flyway_schema_history SET checksum = -832499224 WHERE version = '5';"
    exit 1
fi
