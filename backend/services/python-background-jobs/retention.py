# backend/services/python-background-jobs/retention.py
"""
Retention policy cleanup job.
Replaces RetentionPolicyService.cleanUpOldData()
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


def cleanup_old_data():
    """
    Clean up old data based on retention policy.
    Runs daily at 2:00 AM (replaces @Scheduled(cron = "0 0 2 * * ?"))
    """
    logger.info("Retention policy cleanup started")
    start_time = datetime.now()

    try:
        threshold = datetime.now() - timedelta(days=30)
        threshold_str = threshold.strftime("%Y-%m-%d %H:%M:%S")

        # Find anonymous users older than 30 days
        find_users_sql = text("""
            SELECT id FROM users
            WHERE anonymous_mode = true
              AND created_at < :threshold
        """)

        with engine.connect() as conn:
            result = conn.execute(find_users_sql, {"threshold": threshold_str})
            user_ids = [row[0] for row in result]

        logger.info(f"Found {len(user_ids)} anonymous users to clean up")

        deleted_count = 0
        for user_id in user_ids:
            try:
                with engine.begin() as trans_conn:  # Use transaction per user
                    cleanup_single_user(user_id, trans_conn)
                    deleted_count += 1
            except Exception as e:
                logger.error(f"Failed to clean up anonymous user during retention cleanup: {str(e)}", exc_info=True)

        execution_time = (datetime.now() - start_time).total_seconds()
        logger.info(f"Retention policy cleanup completed. Deleted {deleted_count} users in {execution_time:.2f}s")

        return {
            "success": True,
            "message": f"Cleanup completed successfully",
            "records_deleted": deleted_count,
            "execution_time_seconds": execution_time
        }

    except Exception as e:
        logger.error(f"Error in retention cleanup: {str(e)}", exc_info=True)
        return {
            "success": False,
            "message": f"Cleanup failed: {str(e)}",
            "execution_time_seconds": (datetime.now() - start_time).total_seconds()
        }


def cleanup_single_user(user_id, conn):
    """
    Clean up all data for a single anonymous user.
    Matches RetentionPolicyService.cleanupSingleUser()
    """
    # Delete in order: journal entries, mood entries, user context, messages, chat sessions, user
    # Use transactions to ensure atomicity

    delete_journal_sql = text("DELETE FROM journal_entries WHERE user_id = :user_id")
    delete_mood_sql = text("DELETE FROM mood_entries WHERE user_id = :user_id")
    delete_context_sql = text("DELETE FROM user_contexts WHERE user_id = :user_id")

    # Get chat sessions first
    get_sessions_sql = text("SELECT id FROM chat_sessions WHERE user_id = :user_id")
    sessions_result = conn.execute(get_sessions_sql, {"user_id": user_id})
    session_ids = [row[0] for row in sessions_result]

    if session_ids:
        delete_messages_sql = text("DELETE FROM messages WHERE chat_session_id = ANY(:session_ids)")
        conn.execute(delete_messages_sql, {"session_ids": session_ids})

        delete_sessions_sql = text("DELETE FROM chat_sessions WHERE user_id = :user_id")
        conn.execute(delete_sessions_sql, {"user_id": user_id})

    # Delete other user data
    conn.execute(delete_journal_sql, {"user_id": user_id})
    conn.execute(delete_mood_sql, {"user_id": user_id})
    conn.execute(delete_context_sql, {"user_id": user_id})

    # Finally delete the user
    delete_user_sql = text("DELETE FROM users WHERE id = :user_id")
    conn.execute(delete_user_sql, {"user_id": user_id})

    # Transaction commits automatically when exiting 'with' block
    logger.debug("Cleaned up data for anonymous user")
