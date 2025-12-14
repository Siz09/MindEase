# Getting Started with Python Services

This guide will help you set up and run all the Python microservices that have been integrated with the Java backend.

## Prerequisites

- Python 3.11 or higher
- PostgreSQL database (already running for Java backend)
- Redis (required for background jobs service with Celery)
- OpenAI API key (for AI service)

## Quick Start

### 1. Set Up Python Environment

```bash
# Navigate to services directory
cd backend/services

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate
```

### 2. Install Dependencies for Each Service

**PowerShell (Windows):**

```powershell
# AI Service
cd python-ai-service
pip install -r requirements.txt
cd ..

# Analytics Service
cd python-analytics-service
pip install -r requirements.txt
cd ..

# Background Jobs Service
cd python-background-jobs
pip install -r requirements.txt
cd ..
```

**Or use the helper script:**

```powershell
# From backend/services directory
.\start-all-services.ps1
# (This will also start the services after checking dependencies)
```

**Bash (Linux/Mac):**

```bash
# AI Service
cd python-ai-service && pip install -r requirements.txt && cd ..

# Analytics Service
cd python-analytics-service && pip install -r requirements.txt && cd ..

# Background Jobs Service
cd python-background-jobs && pip install -r requirements.txt && cd ..
```

### 3. Configure Environment Variables

#### AI Service (`python-ai-service/.env`)

```bash
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_TEMPERATURE=0.8
OPENAI_MAX_TOKENS=160
PORT=8000
```

#### Analytics Service (`python-analytics-service/.env`)

```bash
DATABASE_URL=postgresql://mindease:secret@localhost:5432/mindease
PORT=8002
```

#### Background Jobs Service (`python-background-jobs/.env`)

```bash
DATABASE_URL=postgresql://mindease:secret@localhost:5432/mindease
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
INACTIVITY_QUIET_HOURS_START=22
INACTIVITY_QUIET_HOURS_END=8
PORT=8003
```

#### Reports Service (`python-reports-service/.env`)

```bash
PORT=8004
```

#### ML Service (`python-ml-service/.env`)

```bash
ML_MODELS_DIR=./models
PORT=8005
```

### 4. Start Services

#### Option A: Run Each Service Manually (Development)

**PowerShell (Windows) - Easy Way:**

```powershell
# From backend/services directory
.\start-all-services.ps1
```

This will open separate PowerShell windows for each service.

**PowerShell (Windows) - Manual:**
Open separate PowerShell windows for each service:

**Terminal 1 - AI Service:**

```powershell
cd backend\services\python-ai-service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - Analytics Service:**

```powershell
cd backend\services\python-analytics-service
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

**Terminal 3 - Background Jobs Service:**

```powershell
cd backend\services\python-background-jobs
uvicorn main:app --host 0.0.0.0 --port 8003 --reload
```

**Terminal 4 - Celery Worker (for scheduled tasks):**

```powershell
cd backend\services\python-background-jobs
celery -A scheduler worker --loglevel=info
```

**Terminal 5 - Celery Beat (for scheduling):**

```powershell
cd backend\services\python-background-jobs
celery -A scheduler beat --loglevel=info
```

**Bash (Linux/Mac):**

```bash
# Terminal 1 - AI Service
cd backend/services/python-ai-service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Analytics Service
cd backend/services/python-analytics-service
uvicorn main:app --host 0.0.0.0 --port 8002 --reload

# Terminal 3 - Background Jobs Service
cd backend/services/python-background-jobs
uvicorn main:app --host 0.0.0.0 --port 8003 --reload

# Terminal 4 - Celery Worker
cd backend/services/python-background-jobs
celery -A scheduler worker --loglevel=info

# Terminal 5 - Celery Beat
cd backend/services/python-background-jobs
celery -A scheduler beat --loglevel=info
```

#### Option B: Use Docker Compose (Recommended)

Create `backend/services/docker-compose.yml`:

```yaml
version: '3.8'

services:
  python-ai-service:
    build: ./python-ai-service
    ports:
      - '8000:8000'
    env_file:
      - ./python-ai-service/.env
    networks:
      - mindease-network

  python-analytics-service:
    build: ./python-analytics-service
    ports:
      - '8002:8002'
    env_file:
      - ./python-analytics-service/.env
    depends_on:
      - postgres
    networks:
      - mindease-network

  python-background-jobs:
    build: ./python-background-jobs
    ports:
      - '8003:8003'
    env_file:
      - ./python-background-jobs/.env
    depends_on:
      - postgres
      - redis
    networks:
      - mindease-network

  celery-worker:
    build: ./python-background-jobs
    command: celery -A scheduler worker --loglevel=info
    env_file:
      - ./python-background-jobs/.env
    depends_on:
      - redis
      - postgres
    networks:
      - mindease-network

  celery-beat:
    build: ./python-background-jobs
    command: celery -A scheduler beat --loglevel=info
    env_file:
      - ./python-background-jobs/.env
    depends_on:
      - redis
      - postgres
    networks:
      - mindease-network

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    networks:
      - mindease-network

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: mindease
      POSTGRES_USER: mindease
      POSTGRES_PASSWORD: secret
    ports:
      - '5432:5432'
    networks:
      - mindease-network

networks:
  mindease-network:
    driver: bridge
```

Then run:

```bash
cd backend/services
docker-compose up -d
```

### 5. Verify Services Are Running

Check health endpoints:

```bash
# AI Service
curl http://localhost:8000/health

# Analytics Service
curl http://localhost:8002/health

# Background Jobs Service
curl http://localhost:8003/health
```

### 6. Start Java Backend

Make sure your Java backend is configured to use the Python services:

```yaml
# application.yml should have:
python:
  ai:
    service:
      url: http://localhost:8000
  analytics:
    service:
      url: http://localhost:8002
  background-jobs:
    service:
      url: http://localhost:8003
```

Start your Java Spring Boot application as usual.

### 7. Test Integration

#### Test AI Service

```bash
# Test chat generation
curl -X POST http://localhost:8000/chat/generate \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I feel anxious today",
    "user_id": "test-user",
    "history": []
  }'
```

#### Test Analytics Service

```bash
# Test analytics
curl -X POST http://localhost:8002/analytics/daily-active-users \
  -H "Content-Type: application/json" \
  -d '{
    "from_date": "2024-01-01T00:00:00",
    "to_date": "2024-01-31T23:59:59"
  }'
```

#### Test Background Jobs

```bash
# Manual trigger retention cleanup
curl -X POST http://localhost:8003/jobs/retention/trigger

# Manual trigger inactivity detection
curl -X POST http://localhost:8003/jobs/inactivity/trigger

# Manual trigger auto mood creation
curl -X POST http://localhost:8003/jobs/auto-mood/trigger
```

## Troubleshooting

### Service Won't Start

1. **Check if port is already in use:**

   ```bash
   # Windows
   netstat -ano | findstr :8000

   # Linux/Mac
   lsof -i :8000
   ```

2. **Check environment variables:**
   - Ensure `.env` files are in the correct location
   - Verify database connection strings
   - Check OpenAI API key is valid

3. **Check dependencies:**
   ```bash
   pip list  # Verify all packages are installed
   ```

### Database Connection Issues

- Verify PostgreSQL is running
- Check database credentials in `.env` files
- Ensure database exists: `mindease`

### Redis Connection Issues (for Background Jobs)

- Install Redis: `brew install redis` (Mac) or download from redis.io
- Start Redis: `redis-server`
- Verify: `redis-cli ping` (should return `PONG`)

### Python Service Not Responding

- Check logs for errors
- Verify service is listening on correct port
- Check firewall settings
- Ensure Java backend can reach Python services

## Development Tips

1. **Use `--reload` flag** for auto-reload during development:

   ```bash
   uvicorn main:app --reload
   ```

2. **Check logs** for debugging:
   - Python services log to console by default
   - Java backend logs will show Python service calls

3. **Fallback Behavior:**
   - If Python service is unavailable, Java will automatically fall back to Java implementation
   - Check Java logs for fallback messages

4. **Testing:**
   - Test each service independently first
   - Then test integration with Java backend
   - Use Postman or curl for API testing

## Next Steps

1. **Production Deployment:**
   - Use Docker containers
   - Set up proper logging (e.g., ELK stack)
   - Configure monitoring (e.g., Prometheus)
   - Set up reverse proxy (e.g., Nginx)

2. **Performance Tuning:**
   - Adjust worker processes for uvicorn
   - Configure Celery worker pools
   - Optimize database queries

3. **Security:**
   - Use environment variables for secrets
   - Configure CORS properly
   - Add authentication to Python services if needed

## Service URLs Summary

- **AI Service**: http://localhost:8000
- **Analytics Service**: http://localhost:8002
- **Background Jobs Service**: http://localhost:8003
- **Reports Service**: http://localhost:8004 (optional)
- **ML Service**: http://localhost:8005 (optional)
- **Ollama Service**: http://localhost:8001 (existing, unchanged)

## Support

If you encounter issues:

1. Check service logs
2. Verify environment variables
3. Test services independently
4. Check Java backend logs for integration errors
