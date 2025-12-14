# Start all Python services (PowerShell)
# Usage: .\start-all-services.ps1

Write-Host "Starting MindEase Python Services..." -ForegroundColor Green

# Check if virtual environment is activated
if (-not $env:VIRTUAL_ENV) {
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    if (Test-Path "venv\Scripts\Activate.ps1") {
        & .\venv\Scripts\Activate.ps1
    } else {
        Write-Host "Virtual environment not found. Create it first:" -ForegroundColor Red
        Write-Host "  python -m venv venv" -ForegroundColor Cyan
        exit 1
    }
}

# Create logs directory
New-Item -ItemType Directory -Force -Path logs | Out-Null

Write-Host "`nStarting services in separate windows..." -ForegroundColor Cyan

# Get current directory
$servicesDir = Get-Location

# AI Service
$aiPath = Join-Path $servicesDir "python-ai-service"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$aiPath'; & ../venv/Scripts/Activate.ps1; uvicorn main:app --host 0.0.0.0 --port 8000 --reload" -WindowStyle Normal
Start-Sleep -Seconds 2
Write-Host "AI Service starting on http://localhost:8000" -ForegroundColor Green

# Analytics Service
$analyticsPath = Join-Path $servicesDir "python-analytics-service"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$analyticsPath'; & ../venv/Scripts/Activate.ps1; uvicorn main:app --host 0.0.0.0 --port 8002 --reload" -WindowStyle Normal
Start-Sleep -Seconds 2
Write-Host "Analytics Service starting on http://localhost:8002" -ForegroundColor Green

# Background Jobs Service
$jobsPath = Join-Path $servicesDir "python-background-jobs"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$jobsPath'; & ../venv/Scripts/Activate.ps1; uvicorn main:app --host 0.0.0.0 --port 8003 --reload" -WindowStyle Normal
Start-Sleep -Seconds 2
Write-Host "Background Jobs Service starting on http://localhost:8003" -ForegroundColor Green

# Celery Worker (only if Redis is available)
Write-Host ""
Write-Host "Note: Celery Worker and Beat require Redis to be running" -ForegroundColor Yellow

# Check if Redis is accessible
$redisRunning = $false
try {
    $testConnection = Test-NetConnection -ComputerName localhost -Port 6379 -WarningAction SilentlyContinue -InformationLevel Quiet
    $redisRunning = $testConnection.TcpTestSucceeded
} catch {
    $redisRunning = $false
}

if (-not $redisRunning) {
    Write-Host "Warning: Cannot connect to Redis on localhost:6379" -ForegroundColor Red
    Write-Host "Start Redis first or Celery will fail to start" -ForegroundColor Red
}

$redisCheck = Read-Host "Start Celery Worker and Beat? (y/n)"
if ($redisCheck -eq "y") {
    if (-not $redisRunning) {
        Write-Host "Skipping Celery startup - Redis not available" -ForegroundColor Yellow
    } else {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$jobsPath'; & ../venv/Scripts/Activate.ps1; celery -A scheduler worker --loglevel=info" -WindowStyle Normal
        Start-Sleep -Seconds 1
        Write-Host "Celery Worker starting..." -ForegroundColor Green

        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$jobsPath'; & ../venv/Scripts/Activate.ps1; celery -A scheduler beat --loglevel=info" -WindowStyle Normal
        Start-Sleep -Seconds 1
        Write-Host "Celery Beat starting..." -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Cyan
Write-Host "  - AI Service: http://localhost:8000"
Write-Host "  - Analytics Service: http://localhost:8002"
Write-Host "  - Background Jobs Service: http://localhost:8003"
Write-Host ""
Write-Host "Check the new PowerShell windows for service logs" -ForegroundColor Yellow
Write-Host "Press Ctrl+C in each window to stop that service" -ForegroundColor Yellow
