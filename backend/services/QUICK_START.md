# Quick Start Guide - Python Services

## For Windows PowerShell Users

### Step 1: Set Up Environment

```powershell
cd backend\services
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### Step 2: Install Dependencies

```powershell
# Install for each service (run these one at a time)
cd python-ai-service; pip install -r requirements.txt; cd ..
cd python-analytics-service; pip install -r requirements.txt; cd ..
cd python-background-jobs; pip install -r requirements.txt; cd ..
```

### Step 3: Create .env Files

**python-ai-service/.env:**

```
OPENAI_API_KEY=your_key_here
PORT=8000
```

**python-analytics-service/.env:**

```
DATABASE_URL=postgresql://mindease:secret@localhost:5432/mindease
PORT=8002
```

**python-background-jobs/.env:**

```
DATABASE_URL=postgresql://mindease:secret@localhost:5432/mindease
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
PORT=8003
```

### Step 4: Start Services

**Easy way (opens separate windows):**

```powershell
.\start-all-services.ps1
```

**Manual way (5 separate PowerShell windows):**

```powershell
# Window 1
cd python-ai-service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Window 2
cd python-analytics-service
uvicorn main:app --host 0.0.0.0 --port 8002 --reload

# Window 3
cd python-background-jobs
uvicorn main:app --host 0.0.0.0 --port 8003 --reload

# Window 4 (requires Redis)
cd python-background-jobs
celery -A scheduler worker --loglevel=info

# Window 5 (requires Redis)
cd python-background-jobs
celery -A scheduler beat --loglevel=info
```

### Step 5: Verify Services

Open a new PowerShell window and test:

```powershell
# Test health endpoints
Invoke-WebRequest -Uri http://localhost:8000/health
Invoke-WebRequest -Uri http://localhost:8002/health
Invoke-WebRequest -Uri http://localhost:8003/health
```

### Step 6: Start Java Backend

Start your Java Spring Boot application normally. It will automatically use the Python services when available.

## Troubleshooting

**Port already in use:**

```powershell
netstat -ano | findstr :8000
# Kill the process if needed
```

**Redis not running (for background jobs):**

- Download Redis for Windows from: https://github.com/microsoftarchive/redis/releases
- Or use WSL: `wsl redis-server`

**Dependencies won't install:**

- Make sure you're in the virtual environment: `.\venv\Scripts\Activate.ps1`
- Try: `pip install --upgrade pip` first
- The requirements.txt files now use `>=` instead of `==` to avoid compilation issues

## Next Steps

1. Test each service using the health endpoints
2. Start your Java backend
3. Test integration by using your app features
4. Check logs in the PowerShell windows if something doesn't work
