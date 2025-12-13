# Python AI Service

Python microservice for OpenAI-based AI functionality, replacing Java OpenAI service implementations.

## Overview

This service handles:

- OpenAI chat generation
- Journal entry summaries
- Mood insights from journal entries
- Safety classification and risk assessment
- Crisis keyword detection

## Endpoints

- `POST /chat/generate` - Generate chat response using OpenAI
- `POST /journal/summary` - Generate journal entry summary
- `POST /journal/mood-insight` - Generate mood insight from journal entry
- `POST /safety/classify` - Classify message safety and risk level
- `GET /health` - Health check

## Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Configure environment variables (copy `.env.example` to `.env`):

```bash
cp .env.example .env
# Edit .env with your OpenAI API key
```

3. Run the service:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

Or using Docker:

```bash
docker build -t python-ai-service .
docker run -p 8000:8000 --env-file .env python-ai-service
```

## Environment Variables

- `OPENAI_API_KEY` - OpenAI API key (required)
- `OPENAI_MODEL` - Model to use (default: gpt-4o-mini)
- `OPENAI_TEMPERATURE` - Temperature setting (default: 0.8)
- `OPENAI_MAX_TOKENS` - Max tokens (default: 160)
- `PORT` - Service port (default: 8000)

## Integration

The Java backend calls this service via HTTP REST API. The service URL is configured in `application.yml`:

```yaml
python:
  ai:
    service:
      url: http://localhost:8000
```
