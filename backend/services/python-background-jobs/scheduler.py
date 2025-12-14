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
from retention import cleanup_old_data
from inactivity import detect_inactive_users
from auto_mood import create_auto_entries

# Register tasks
app.task(name="retention.cleanup_old_data")(cleanup_old_data)
app.task(name="inactivity.detect_inactive_users")(detect_inactive_users)
app.task(name="auto_mood.create_auto_entries")(create_auto_entries)

if __name__ == "__main__":
    app.start()
