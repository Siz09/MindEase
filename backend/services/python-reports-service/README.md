# Python Reports Service

Python microservice for generating reports (admin dashboard, user insights, analytics summaries).

## Overview

This service handles:

- Admin dashboard reports
- User insights reports
- Analytics summary reports

## Endpoints

- `POST /reports/admin/dashboard` - Generate admin dashboard report
- `POST /reports/user/insights` - Generate user insights report
- `POST /reports/analytics/summary` - Generate analytics summary report
- `GET /reports/{report_id}/download` - Download generated report
- `GET /health` - Health check

## Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Run the service:

```bash
uvicorn main:app --host 0.0.0.0 --port 8004
```

## Environment Variables

- `PORT` - Service port (default: 8004)
