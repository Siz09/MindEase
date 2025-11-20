# Fix Flyway migration checksum mismatch (PowerShell script for Windows)
# This script repairs the Flyway schema history table to match the current migration files

Write-Host "🔧 Fixing Flyway checksum mismatch..." -ForegroundColor Cyan

# Set database connection details (update if needed)
$env:DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$env:DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$env:DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "mindease" }
$env:DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "mindease" }
$env:DB_PASSWORD = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "secret" }

Write-Host "Connecting to database: $env:DB_NAME on ${env:DB_HOST}:${env:DB_PORT}"

# Run Flyway repair
mvn flyway:repair -Dflyway.url="jdbc:postgresql://${env:DB_HOST}:${env:DB_PORT}/${env:DB_NAME}" `
                  -Dflyway.user="$env:DB_USER" `
                  -Dflyway.password="$env:DB_PASSWORD"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Flyway checksum repair completed successfully!" -ForegroundColor Green
    Write-Host "You can now start the backend application."
} else {
    Write-Host "❌ Flyway repair failed. Please check the error messages above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Manually update the checksum in the database:"
    Write-Host "  UPDATE flyway_schema_history SET checksum = -832499224 WHERE version = '5';" -ForegroundColor Yellow
    exit 1
}
