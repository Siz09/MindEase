# backend/services/python-background-jobs/inactivity.py
"""
Inactivity detection job.
Replaces InactivityDetectionService.detectInactiveUsers()
"""
import logging
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
import os

logger = logging.getLogger(__name__)

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")
engine = create_engine(DATABASE_URL)

# Configuration


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
            SELECT ua.user_id, u.id, u.email, u.anonymous_mode
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

                # Skip if already notified
                if user_id in notified_user_ids:
                    logger.debug(f"User {user_id} already received inactivity notification")
                    continue

                # Skip anonymous users
                if anonymous_mode:
                    logger.debug(f"Skipping anonymous user: {user_id}")
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
