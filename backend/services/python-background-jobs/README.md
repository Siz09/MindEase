# Python Background Jobs Service

Python microservice for scheduled background jobs, replacing Java scheduled tasks.

## Overview

This service handles:

- Retention policy cleanup (daily at 2:00 AM)
- Inactivity detection (hourly)
- Auto mood entry creation (daily at midnight)

## Endpoints

- `POST /jobs/retention/trigger` - Manual retention cleanup
- `POST /jobs/inactivity/trigger` - Manual inactivity detection
- `POST /jobs/auto-mood/trigger` - Manual auto mood creation
- `GET /health` - Health check

## Scheduled Tasks

Tasks are scheduled using Celery Beat:

- **Retention Cleanup**: Daily at 2:00 AM
- **Inactivity Detection**: Every hour
- **Auto Mood Creation**: Daily at midnight

## Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Configure environment variables:

```bash
cp .env.example .env
# Edit .env with your database URL and Redis URL
```

3. Start Redis (required for Celery):

```bash
redis-server
```

4. Run the service:

```bash
uvicorn main:app --host 0.0.0.0 --port 8003
```

5. Run Celery worker (for scheduled tasks):

```bash
celery -A scheduler worker --loglevel=info
```

6. Run Celery beat (for scheduling):

```bash
celery -A scheduler beat --loglevel=info
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (required)
- `CELERY_BROKER_URL` - Redis broker URL (default: redis://localhost:6379/0)
- `CELERY_RESULT_BACKEND` - Redis result backend (default: redis://localhost:6379/0)
- `INACTIVITY_QUIET_HOURS_START` - Quiet hours start (default: 22)
- `INACTIVITY_QUIET_HOURS_END` - Quiet hours end (default: 8)
- `PORT` - Service port (default: 8003)

## Integration

The Java backend calls this service via HTTP REST API for manual triggers. Scheduled tasks run via Celery Beat.
