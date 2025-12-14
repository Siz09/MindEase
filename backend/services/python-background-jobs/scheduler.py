# backend/services/python-background-jobs/scheduler.py
"""
Celery app configuration for scheduled tasks.
"""
from celery import Celery
from celery.schedules import crontab

# Create Celery app
app = Celery("background_jobs")
app.config_from_object("celeryconfig")

# Import tasks
# Note: Using absolute imports since this file is run directly as a script
from retention import cleanup_old_data
from inactivity import detect_inactive_users
from auto_mood import create_auto_entries

# Register tasks
app.task(name="retention.cleanup_old_data")(cleanup_old_data)
app.task(name="inactivity.detect_inactive_users")(detect_inactive_users)
app.task(name="auto_mood.create_auto_entries")(create_auto_entries)

if __name__ == "__main__":
    # WARNING: Running beat and worker in the same process is NOT recommended for production.
    # In production, run these as separate processes:
    #   Terminal 1: celery -A background_jobs beat
    #   Terminal 2: celery -A background_jobs worker
    # This startup mode is intended for local development only.
    app.start(['beat', 'worker'])
