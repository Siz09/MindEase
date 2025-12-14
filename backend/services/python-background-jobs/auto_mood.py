# backend/services/python-background-jobs/auto_mood.py
"""
Auto mood entry creation job.
Replaces AutoMoodService.createAutoMoodEntries()
"""
import logging
from datetime import datetime, date, timedelta
from sqlalchemy import create_engine, text
import os

logger = logging.getLogger(__name__)

# Database connection
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://mindease:secret@localhost:5432/mindease"
)
engine = create_engine(DATABASE_URL)


def create_auto_entries():
    """
    Create automatic mood entries for users who haven't logged one today.
    Runs daily at midnight (replaces @Scheduled(cron = "0 0 0 * * ?"))
    """
    logger.info(f"Starting automatic mood entry creation at {datetime.now()}")
    start_time = datetime.now()

    try:
        today = date.today()
        start_of_day = datetime.combine(today, datetime.min.time())
        end_of_day = datetime.combine(today, datetime.max.time())

        # Get all non-anonymous users
        users_sql = text("""
            SELECT id, email
            FROM users
            WHERE anonymous_mode IS NULL OR anonymous_mode = false
        """)

        created_entries = 0

        with engine.connect() as conn:
            users_result = conn.execute(users_sql)

            for row in users_result:
                user_id = row[0]
                email = row[1]

                # Check if user already has a mood entry today
                check_entry_sql = text("""
                    SELECT COUNT(*)
                    FROM mood_entries
                    WHERE user_id = :user_id
                      AND created_at BETWEEN :start_of_day AND :end_of_day
                """)

                count_result = conn.execute(
                    check_entry_sql,
                    {
                        "user_id": user_id,
                        "start_of_day": start_of_day.strftime("%Y-%m-%d %H:%M:%S"),
                        "end_of_day": end_of_day.strftime("%Y-%m-%d %H:%M:%S")
                    }
                )
                count = count_result.scalar()

                if count == 0:
                    # Create auto mood entry
                    create_entry_sql = text("""
                        INSERT INTO mood_entries (user_id, mood_value, notes, created_at)
                        VALUES (:user_id, :mood_value, :notes, :created_at)
                    """)

                    conn.execute(
                        create_entry_sql,
                        {
                            "user_id": user_id,
                            "mood_value": 5,
                            "notes": "Automatic daily mood check-in. How are you feeling today?",
                            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        }
                    )
                    conn.commit()
                    created_entries += 1
                    logger.info(f"Created auto mood entry for user: {email}")

        execution_time = (datetime.now() - start_time).total_seconds()
        logger.info(f"Auto mood entry creation completed. Created {created_entries} entries in {execution_time:.2f}s")

        return {
            "success": True,
            "message": "Auto mood entry creation completed successfully",
            "records_created": created_entries,
            "execution_time_seconds": execution_time
        }

    except Exception as e:
        logger.error(f"Error creating automatic mood entries: {str(e)}", exc_info=True)
        return {
            "success": False,
            "message": f"Auto mood creation failed: {str(e)}",
            "execution_time_seconds": (datetime.now() - start_time).total_seconds()
        }
