# Testing Guide - Python Background Jobs Service

## Status Summary

✅ **Java Backend Integration**: Working

- Java backend successfully calls Python AI service at `http://localhost:8000/chat/generate`
- AI responses are being generated and returned correctly

## Prerequisites

Before testing, ensure all services are running:

1. **Redis** (required for Celery):

   ```powershell
   docker ps --filter name=redis-mindease
   # If not running: docker start redis-mindease
   ```

2. **Python Background Jobs Service** (port 8003):

   ```powershell
   cd backend\services\python-background-jobs
   uvicorn main:app --host 0.0.0.0 --port 8003 --reload
   ```

3. **Celery Worker**:

   ```powershell
   cd backend\services\python-background-jobs
   celery -A scheduler worker --loglevel=info
   ```

4. **Celery Beat** (for scheduled tasks):
   ```powershell
   cd backend\services\python-background-jobs
   celery -A scheduler beat --loglevel=info
   ```

## Test Plan

### 1. Health Check Test

Verify the service is running:

```powershell
# PowerShell
Invoke-WebRequest -Uri http://localhost:8003/health

# Expected response:
# {"status":"healthy","service":"python-background-jobs"}
```

**Expected Result**: HTTP 200 with `{"status":"healthy","service":"python-background-jobs"}`

---

### 2. Retention Cleanup Job Test

Test manual trigger of retention cleanup:

```powershell
# PowerShell
Invoke-WebRequest -Uri http://localhost:8003/jobs/retention/trigger -Method POST

# Or with curl (if available)
curl -X POST http://localhost:8003/jobs/retention/trigger
```

**What to Check**:

- ✅ HTTP 200 response
- ✅ Response contains `success: true` or similar
- ✅ Check Celery worker logs for task execution
- ✅ Verify database: old data should be cleaned up (check retention policy rules)

**Expected Response**:

```json
{
  "success": true,
  "message": "Retention cleanup completed",
  "items_processed": 0,
  "items_deleted": 0
}
```

---

### 3. Inactivity Detection Job Test

Test manual trigger of inactivity detection:

```powershell
# PowerShell
Invoke-WebRequest -Uri http://localhost:8003/jobs/inactivity/trigger -Method POST

# Or with curl
curl -X POST http://localhost:8003/jobs/inactivity/trigger
```

**What to Check**:

- ✅ HTTP 200 response
- ✅ Response indicates inactive users detected
- ✅ Check Celery worker logs for task execution
- ✅ Verify database: `user_activity.last_active_at` should be updated
- ✅ Check if notifications were sent (if configured)

**Expected Response**:

```json
{
  "success": true,
  "message": "Inactivity detection completed",
  "users_checked": 10,
  "inactive_users_found": 2
}
```

---

### 4. Auto Mood Creation Job Test

Test manual trigger of auto mood entry creation:

```powershell
# PowerShell
Invoke-WebRequest -Uri http://localhost:8003/jobs/auto-mood/trigger -Method POST

# Or with curl
curl -X POST http://localhost:8003/jobs/auto-mood/trigger
```

**What to Check**:

- ✅ HTTP 200 response
- ✅ Response indicates mood entries created
- ✅ Check Celery worker logs for task execution
- ✅ Verify database: Check `mood_entries` table for new auto-generated entries

**Expected Response**:

```json
{
  "success": true,
  "message": "Auto mood entries created",
  "entries_created": 5
}
```

---

### 5. Celery Worker Verification

Check that Celery worker is processing tasks:

**In Celery Worker Terminal**, you should see:

```
[INFO] Task retention.cleanup_old_data[task-id] received
[INFO] Task retention.cleanup_old_data[task-id] succeeded
```

**Test by triggering a job and watching the worker logs.**

---

### 6. Celery Beat Schedule Verification

Check that scheduled tasks are registered:

**In Celery Beat Terminal**, you should see:

```
[INFO] Scheduler: Sending due task retention-cleanup (retention.cleanup_old_data)
[INFO] Scheduler: Sending due task inactivity-detection (inactivity.detect_inactive_users)
[INFO] Scheduler: Sending due task auto-mood-creation (auto_mood.create_auto_entries)
```

**Verify Schedule**:

- Retention cleanup: Daily at 2:00 AM
- Inactivity detection: Every hour (3600 seconds)
- Auto mood creation: Daily at midnight

---

### 7. Database Verification Tests

After running each job, verify database changes:

#### Retention Cleanup

```sql
-- Check if old data was deleted (based on retention policy)
SELECT COUNT(*) FROM messages WHERE deleted_at IS NOT NULL;
SELECT COUNT(*) FROM chat_sessions WHERE deleted_at IS NOT NULL;
```

#### Inactivity Detection

```sql
-- Check user activity updates
SELECT id, email, last_active_at
FROM users u
JOIN user_activity ua ON u.id = ua.user_id
ORDER BY ua.last_active_at DESC
LIMIT 10;
```

#### Auto Mood Creation

```sql
-- Check auto-generated mood entries
SELECT id, user_id, created_at, mood_type
FROM mood_entries
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

---

### 8. Error Handling Tests

Test error scenarios:

#### Test with Invalid Database Connection

1. Stop PostgreSQL temporarily
2. Trigger a job
3. Verify error response is returned properly

#### Test with Redis Down

1. Stop Redis: `docker stop redis-mindease`
2. Try to trigger a job via HTTP (should still work - runs synchronously)
3. Check Celery worker (should show connection errors)
4. Restart Redis: `docker start redis-mindease`

---

### 9. Integration Test with Java Backend

Verify Java backend can call Python service:

```java
// If you have a test endpoint in Java, test:
// POST /api/admin/jobs/retention/trigger
// POST /api/admin/jobs/inactivity/trigger
// POST /api/admin/jobs/auto-mood/trigger
```

**Check Java logs** for:

- Successful HTTP calls to Python service
- Proper error handling if Python service is down

---

### 10. Performance Test

Test with large datasets:

1. Create test data (many old messages, inactive users, etc.)
2. Trigger retention cleanup
3. Measure execution time
4. Verify all data is processed correctly

---

## Quick Test Script (PowerShell)

Save this as `test-background-jobs.ps1`:

```powershell
# Test Background Jobs Service
$baseUrl = "http://localhost:8003"

Write-Host "Testing Background Jobs Service..." -ForegroundColor Cyan

# 1. Health Check
Write-Host "`n1. Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET
    Write-Host "✅ Health check passed: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
}

# 2. Retention Cleanup
Write-Host "`n2. Retention Cleanup..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/jobs/retention/trigger" -Method POST
    Write-Host "✅ Retention cleanup triggered: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Retention cleanup failed: $_" -ForegroundColor Red
}

# 3. Inactivity Detection
Write-Host "`n3. Inactivity Detection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/jobs/inactivity/trigger" -Method POST
    Write-Host "✅ Inactivity detection triggered: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Inactivity detection failed: $_" -ForegroundColor Red
}

# 4. Auto Mood Creation
Write-Host "`n4. Auto Mood Creation..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/jobs/auto-mood/trigger" -Method POST
    Write-Host "✅ Auto mood creation triggered: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Auto mood creation failed: $_" -ForegroundColor Red
}

Write-Host "`n✅ All tests completed!" -ForegroundColor Green
```

Run it:

```powershell
cd backend\services\python-background-jobs
.\test-background-jobs.ps1
```

---

## Troubleshooting

### Service Not Responding

- Check if service is running: `netstat -ano | findstr :8003`
- Check service logs for errors
- Verify `.env` file exists and has correct `DATABASE_URL`

### Celery Tasks Not Running

- Verify Redis is running: `docker ps --filter name=redis-mindease`
- Check Celery worker logs for connection errors
- Verify `CELERY_BROKER_URL` in environment

### Database Connection Errors

- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env` file
- Test connection: `psql $DATABASE_URL -c "SELECT 1;"`

---

## Success Criteria

✅ All tests pass when:

1. Health endpoint returns 200
2. All three job triggers return success responses
3. Celery worker processes tasks without errors
4. Celery Beat shows scheduled tasks
5. Database changes are visible after job execution
6. Java backend can successfully call Python service endpoints
