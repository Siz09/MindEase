# Verify Environment Variables and Database Configuration (PowerShell)
# This script checks that all required environment variables and database connections are configured

Write-Host "Verifying Environment Variables and Database Configuration..." -ForegroundColor Cyan
Write-Host ""

$errors = 0
$warnings = 0

# Function to check environment variable
function Check-EnvVar {
    param(
        [string]$VarName,
        [string]$Required = "optional",
        [string]$Description
    )

    $value = [Environment]::GetEnvironmentVariable($VarName, "Process")
    if ([string]::IsNullOrEmpty($value)) {
        $value = [Environment]::GetEnvironmentVariable($VarName, "User")
    }
    if ([string]::IsNullOrEmpty($value)) {
        $value = [Environment]::GetEnvironmentVariable($VarName, "Machine")
    }

    if ([string]::IsNullOrEmpty($value)) {
        if ($Required -eq "required") {
            Write-Host "[X] $VarName - $Description (REQUIRED - NOT SET)" -ForegroundColor Red
            $script:errors++
        }
        else {
            Write-Host "[!] $VarName - $Description (Optional - not set)" -ForegroundColor Yellow
            $script:warnings++
        }
    }
    else {
        Write-Host "[OK] $VarName - $Description" -ForegroundColor Green
    }
}

# Function to check file exists
function Check-File {
    param(
        [string]$FilePath,
        [string]$Description,
        [string]$Required = "optional"
    )

    if (Test-Path $FilePath) {
        Write-Host "[OK] $FilePath - $Description" -ForegroundColor Green
    }
    else {
        if ($Required -eq "required") {
            Write-Host "[X] $FilePath - $Description (REQUIRED - NOT FOUND)" -ForegroundColor Red
            $script:errors++
        }
        else {
            Write-Host "[!] $FilePath - $Description (Optional - not found)" -ForegroundColor Yellow
            $script:warnings++
        }
    }
}

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "Environment Variables Check" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

# Required Environment Variables
Write-Host "Required Variables:" -ForegroundColor Red
Check-EnvVar -VarName "OPENAI_API_KEY" -Required "required" -Description "Required for journal AI summaries"
Check-EnvVar -VarName "JWT_SECRET" -Required "optional" -Description "JWT token secret (has dev default)"

# Stripe Configuration
Write-Host ""
Write-Host "Stripe Configuration (Required for Subscriptions):" -ForegroundColor Magenta
Check-EnvVar -VarName "STRIPE_SECRET_KEY" -Required "optional" -Description "Stripe secret key (has dev default: sk_test_xxx)"
Check-EnvVar -VarName "STRIPE_PUBLISHABLE_KEY" -Required "optional" -Description "Stripe publishable key (has dev default: pk_test_xxx)"
Check-EnvVar -VarName "STRIPE_WEBHOOK_SECRET" -Required "optional" -Description "Stripe webhook secret (has dev default: whsec_xxx)"
Check-EnvVar -VarName "STRIPE_PRICE_ID_MONTHLY" -Required "optional" -Description "Stripe monthly price ID"
Check-EnvVar -VarName "STRIPE_PRICE_ID_ANNUAL" -Required "optional" -Description "Stripe annual price ID"

# Email Configuration
Write-Host ""
Write-Host "Email Configuration (Optional):" -ForegroundColor Cyan
Check-EnvVar -VarName "EMAIL_USERNAME" -Required "optional" -Description "Email username for notifications"
Check-EnvVar -VarName "EMAIL_PASSWORD" -Required "optional" -Description "Email password for notifications"

# Optional Environment Variables
Write-Host ""
Write-Host "Optional Configuration:" -ForegroundColor Gray
Check-EnvVar -VarName "CHAT_FREE_DAILY_LIMIT" -Required "optional" -Description "Daily message limit for free users (default: 20)"
Check-EnvVar -VarName "STRIPE_SUCCESS_URL" -Required "optional" -Description "Stripe success URL (has default)"
Check-EnvVar -VarName "STRIPE_CANCEL_URL" -Required "optional" -Description "Stripe cancel URL (has default)"
Check-EnvVar -VarName "CORS_ALLOWED_ORIGINS" -Required "optional" -Description "CORS allowed origins (has default)"
Check-EnvVar -VarName "DATABASE_URL" -Required "optional" -Description "Database connection URL (using application.yml defaults)"

# File Checks
Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "Required Files Check" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

$backendDir = Split-Path -Parent $PSScriptRoot
Check-File -FilePath "$backendDir\src\main\resources\firebase-service-account.json" -Required "required" -Description "Firebase service account JSON (required for auth)"
Check-File -FilePath "$backendDir\src\main\resources\application.yml" -Required "required" -Description "Application configuration file"
Check-File -FilePath "$backendDir\src\main\resources\application-dev.yml" -Required "optional" -Description "Development profile configuration"

# Database Configuration Check
Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "Database Configuration Check" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

$dbHost = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$dbPort = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$dbName = if ($env:DB_NAME) { $env:DB_NAME } else { "mindease" }
$dbUser = if ($env:DB_USER) { $env:DB_USER } else { "mindease" }
$dbPassword = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "secret" }

Write-Host "Database Configuration:"
Write-Host "  Host: $dbHost"
Write-Host "  Port: $dbPort"
Write-Host "  Database: $dbName"
Write-Host "  User: $dbUser"
Write-Host ""

# Check Docker
Write-Host "Checking Docker..."
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "[OK] Docker is installed" -ForegroundColor Green
    $containers = docker ps --format "{{.Names}}"
    if ($containers -match "postgres") {
        Write-Host "[OK] PostgreSQL container is running" -ForegroundColor Green
    }
    else {
        Write-Host "[!] PostgreSQL container not running" -ForegroundColor Yellow
        Write-Host "   Start with: cd backend\docker; docker-compose up -d"
        $warnings++
    }
}
else {
    Write-Host "[!] Docker not found - cannot check container status" -ForegroundColor Yellow
    Write-Host "   Install Docker Desktop or verify database connection manually"
    $warnings++
}

# Summary
Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "Verification Summary" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

if ($errors -eq 0 -and $warnings -eq 0) {
    Write-Host "[OK] All checks passed! Environment is properly configured." -ForegroundColor Green
    exit 0
}
elseif ($errors -eq 0) {
    Write-Host "[!] Configuration complete with $warnings warning(s)" -ForegroundColor Yellow
    Write-Host "   Review warnings above - application may work but some features may be limited"
    exit 0
}
else {
    Write-Host "[X] Configuration incomplete: $errors error(s), $warnings warning(s)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Required fixes:"
    Write-Host "  1. Set missing required environment variables"
    Write-Host "  2. Ensure Firebase service account file exists"
    Write-Host "  3. Verify database is running and accessible"
    Write-Host ""
    Write-Host "See backend/docs/ENVIRONMENT_SETUP.md for detailed setup instructions"
    exit 1
}
