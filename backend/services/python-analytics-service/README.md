# Python Analytics Service

Python microservice for analytics and data processing, replacing Java analytics implementations.

## Overview

This service handles:

- Daily active users analytics
- AI usage statistics
- Mood correlation analysis
- User growth metrics
- Mood prediction using machine learning
- Mood trend analysis
- Chat impact analysis

## Endpoints

### Analytics

- `POST /analytics/daily-active-users` - Daily active users over date range
- `POST /analytics/ai-usage` - Daily AI usage statistics
- `POST /analytics/mood-correlation` - Mood and chat correlation
- `POST /analytics/user-growth` - User growth statistics
- `POST /analytics/distinct-active-users` - Distinct active users count

### Mood Analysis

- `POST /mood/predict` - Predict mood trend using ML
- `POST /mood/trend` - Get mood trend over time
- `POST /mood/analyze-impact` - Analyze chat impact on mood

## Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Configure environment variables:

```bash
cp .env.example .env
# Edit .env with your database URL
```

3. Run the service:

```bash
uvicorn main:app --host 0.0.0.0 --port 8002
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (required)
- `PORT` - Service port (default: 8002)
