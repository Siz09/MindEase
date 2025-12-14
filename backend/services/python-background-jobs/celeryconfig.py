# backend/services/python-background-jobs/celeryconfig.py
"""
Celery configuration for scheduled background jobs.
"""
import os
from celery.schedules import crontab
from datetime import timedelta

# Broker and result backend
broker_url = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
result_backend = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

# Task settings
task_serializer = "json"
accept_content = ["json"]
result_serializer = "json"
timezone = "UTC"
enable_utc = True

# Task routing
task_routes = {
    "retention.cleanup_old_data": {"queue": "background_jobs"},
    "inactivity.detect_inactive_users": {"queue": "background_jobs"},
    "auto_mood.create_auto_entries": {"queue": "background_jobs"},
}

# Scheduled tasks (cron format: minute, hour, day_of_month, month, day_of_week)
beat_schedule = {
    "retention-cleanup": {
        "task": "retention.cleanup_old_data",
        "schedule": crontab(hour=2, minute=0),  # Daily at 2:00 AM
    },
    "inactivity-detection": {
        "task": "inactivity.detect_inactive_users",
        "schedule": timedelta(seconds=3600),  # Every hour
    },
    "auto-mood-creation": {
        "task": "auto_mood.create_auto_entries",
        "schedule": crontab(hour=0, minute=0),  # Daily at midnight
    },
}
