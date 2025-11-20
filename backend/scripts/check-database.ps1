# Quick database connectivity check (PowerShell)

$dbHost = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$dbPort = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$dbName = if ($env:DB_NAME) { $env:DB_NAME } else { "mindease" }
$dbUser = if ($env:DB_USER) { $env:DB_USER } else { "mindease" }
$dbPassword = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "secret" }

Write-Host "Checking database connection..." -ForegroundColor Cyan
Write-Host "  Host: $dbHost"
Write-Host "  Port: $dbPort"
Write-Host "  Database: $dbName"
Write-Host "  User: $dbUser"
Write-Host ""

# Check if psql is available
if (Get-Command psql -ErrorAction SilentlyContinue) {
    $env:PGPASSWORD = $dbPassword
    $result = psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c "SELECT version();" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Database connection successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Checking required tables..."
        $tables = @("users", "mood_entries", "journal_entries", "subscriptions", "audit_logs", "notifications", "messages", "chat_sessions")
        foreach ($table in $tables) {
            $exists = psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '$table');" 2>&1
            if ($exists -match "t") {
                Write-Host "  [OK] $table" -ForegroundColor Green
            }
            else {
                Write-Host "  [!] $table (not found - run Flyway migrations)" -ForegroundColor Yellow
            }
        }
        exit 0
    }
    else {
        Write-Host "[X] Database connection failed" -ForegroundColor Red
        Write-Host ""
        Write-Host "Troubleshooting:"
        Write-Host "  1. Is PostgreSQL running?"
        Write-Host "     - Docker: cd backend\docker; docker-compose up -d"
        Write-Host "     - Manual: Check PostgreSQL service status"
        Write-Host "  2. Are credentials correct? (check application.yml)"
        Write-Host "  3. Is port 5432 accessible?"
        exit 1
    }
}
else {
    Write-Host "[!] psql not found - cannot test database connection" -ForegroundColor Yellow
    Write-Host "   Install PostgreSQL client or use Docker"
    exit 1
}
