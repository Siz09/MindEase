# Test Background Jobs Service
# Run this script to test all endpoints

$baseUrl = "http://localhost:8003"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Background Jobs Service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Health Check
Write-Host "`n[1/4] Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET -ErrorAction Stop
    Write-Host "✅ Health check passed: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
    Write-Host "   Make sure the service is running on port 8003" -ForegroundColor Yellow
    exit 1
}

# 2. Retention Cleanup
Write-Host "`n[2/4] Retention Cleanup..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/jobs/retention/trigger" -Method POST -ErrorAction Stop
    Write-Host "✅ Retention cleanup triggered: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Retention cleanup failed: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Error details: $responseBody" -ForegroundColor Red
    }
}

# 3. Inactivity Detection
Write-Host "`n[3/4] Inactivity Detection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/jobs/inactivity/trigger" -Method POST -ErrorAction Stop
    Write-Host "✅ Inactivity detection triggered: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Inactivity detection failed: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Error details: $responseBody" -ForegroundColor Red
    }
}

# 4. Auto Mood Creation
Write-Host "`n[4/4] Auto Mood Creation..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/jobs/auto-mood/trigger" -Method POST -ErrorAction Stop
    Write-Host "✅ Auto mood creation triggered: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Auto mood creation failed: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Error details: $responseBody" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ All tests completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Check Celery worker logs for task execution" -ForegroundColor Gray
Write-Host "2. Check Celery beat logs for scheduled tasks" -ForegroundColor Gray
Write-Host "3. Verify database changes in PostgreSQL" -ForegroundColor Gray
