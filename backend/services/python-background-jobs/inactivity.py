# backend/services/python-background-jobs/inactivity.py
"""
Inactivity detection job.
Replaces InactivityDetectionService.detectInactiveUsers()
"""
import logging
from datetime import datetime, timedelta, time
from sqlalchemy import create_engine, text
import os

logger = logging.getLogger(__name__)

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")
engine = create_engine(DATABASE_URL)

# Configuration
QUIET_HOURS_START = int(os.getenv("INACTIVITY_QUIET_HOURS_START", "22"))  # 10 PM
QUIET_HOURS_END = int(os.getenv("INACTIVITY_QUIET_HOURS_END", "8"))  # 8 AM


def detect_inactive_users():
    """
    Detect inactive users and create gentle notifications.
    Runs hourly (replaces @Scheduled(cron = "0 0 * * * *"))
    """
    logger.info("🕒 Running Inactivity Detection Job...")
    start_time = datetime.now()

    try:
        threshold = datetime.now() - timedelta(days=3)
        threshold_str = threshold.strftime("%Y-%m-%d %H:%M:%S")

        # Get users who already received inactivity reminder recently (last 3 days)
        notified_users_sql = text("""
            SELECT DISTINCT user_id
            FROM notifications
            WHERE notification_type = 'INACTIVITY_REMINDER'
              AND created_at >= :since
        """)

        with engine.connect() as conn:
            notified_result = conn.execute(
                notified_users_sql,
                {"since": (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d %H:%M:%S")}
            )
            notified_user_ids = {row[0] for row in notified_result}

        # Find inactive users (last active more than 3 days ago)
        inactive_users_sql = text("""
            SELECT ua.user_id, u.id, u.email, u.anonymous_mode, u.quiet_hours_start, u.quiet_hours_end
            FROM user_activities ua
            JOIN users u ON ua.user_id = u.id
            WHERE ua.last_active_at < :threshold
              AND (u.anonymous_mode IS NULL OR u.anonymous_mode = false)
            ORDER BY ua.last_active_at
            LIMIT 1000
        """)

        notifications_created = 0

        with engine.connect() as conn:
            result = conn.execute(inactive_users_sql, {"threshold": threshold_str})

            for row in result:
                user_id = row[0]
                email = row[2]
                anonymous_mode = row[3]
                quiet_hours_start = row[4]
                quiet_hours_end = row[5]

                # Skip if already notified
                if user_id in notified_user_ids:
                    logger.debug(f"User {user_id} already received inactivity notification")
                    continue

                # Skip anonymous users
                if anonymous_mode:
                    logger.debug(f"Skipping anonymous user: {user_id}")
                    continue

                # Check quiet hours
                user_quiet_start = quiet_hours_start if quiet_hours_start is not None else QUIET_HOURS_START
                user_quiet_end = quiet_hours_end if quiet_hours_end is not None else QUIET_HOURS_END

                if is_within_quiet_hours(user_quiet_start, user_quiet_end):
                    logger.debug(f"Skipping quiet hours for user: {user_id}")
                    continue

                # Create notification
                message = "Hey there! We've noticed you haven't been active lately. How are you feeling today? 💚"

                try:
                    create_notification_sql = text("""
                        INSERT INTO notifications (user_id, notification_type, message, created_at)
                        VALUES (:user_id, 'INACTIVITY_REMINDER', :message, :created_at)
                    """)
                    conn.execute(
                        create_notification_sql,
                        {
                            "user_id": user_id,
                            "message": message,
                            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        }
                    )
                    conn.commit()
                    notifications_created += 1
                    logger.info(f"Created inactivity notification for user: {user_id}")
                except Exception as e:
                    logger.error(f"Failed to create notification for user {user_id}: {str(e)}", exc_info=True)
                    conn.rollback()

        execution_time = (datetime.now() - start_time).total_seconds()
        logger.info(f"✅ Inactivity Detection Job completed. Notifications created: {notifications_created} in {execution_time:.2f}s")

        return {
            "success": True,
            "message": "Inactivity detection completed successfully",
            "records_processed": notifications_created,
            "records_created": notifications_created,
            "execution_time_seconds": execution_time
        }

    except Exception as e:
        logger.error(f"Error in inactivity detection: {str(e)}", exc_info=True)
        return {
            "success": False,
            "message": f"Inactivity detection failed: {str(e)}",
            "execution_time_seconds": (datetime.now() - start_time).total_seconds()
        }


def is_within_quiet_hours(quiet_start: int, quiet_end: int) -> bool:
    """
    Determines if current time is within quiet hours.
    Matches InactivityDetectionService.isWithinQuietHours()
    """
    now = datetime.now().time()
    quiet_start_time = time(quiet_start, 0)
    quiet_end_time = time(quiet_end, 0)

    if quiet_start_time == quiet_end_time:
        # Quiet hours disabled
        return False
    elif quiet_start_time < quiet_end_time:
        # Quiet hours within same day: [quietStart, quietEnd)
        return quiet_start_time <= now < quiet_end_time
    else:
        # Quiet hours cross midnight: [quietStart, 24:00) or [00:00, quietEnd)
        return now >= quiet_start_time or now < quiet_end_time
