# backend/services/python-analytics-service/analytics.py
from fastapi import APIRouter, HTTPException, Query
from typing import List
from datetime import datetime, date
import pandas as pd
from sqlalchemy import create_engine, text
import os
import logging

from models import (
    AnalyticsRequest,
    ActiveUsersPoint,
    AiUsagePoint,
    MoodCorrelationPoint
)

router = APIRouter()
logger = logging.getLogger(__name__)

# Database connection
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://mindease:secret@localhost:5432/mindease"
)
engine = create_engine(DATABASE_URL)


def validate_date_range(from_date: datetime, to_date: datetime):
    """Validate date range parameters"""
    if from_date is None or to_date is None:
        raise ValueError("Date range parameters cannot be null")
    if from_date > to_date:
        raise ValueError("'from' must be before or equal to 'to'")


@router.post("/analytics/daily-active-users", response_model=List[ActiveUsersPoint])
async def daily_active_users(request: AnalyticsRequest):
    """
    Get daily active users.
    Replaces AnalyticsRepository.dailyActiveUsers()
    """
    try:
        validate_date_range(request.from_date, request.to_date)

        sql = text("""
            SELECT DATE(created_at) AS day, COUNT(DISTINCT user_id) AS active_users
            FROM audit_logs
            WHERE created_at BETWEEN :from_date AND :to_date
            GROUP BY day
            ORDER BY day
        """)

        df = pd.read_sql(
            sql,
            engine,
            params={"from_date": request.from_date, "to_date": request.to_date}
        )

        # Convert to response format
        results = []
        for _, row in df.iterrows():
            results.append(ActiveUsersPoint(
                day=row['day'] if isinstance(row['day'], date) else row['day'].date(),
                activeUsers=int(row['active_users'])
            ))

        return results

    except Exception as e:
        logger.error(f"Error in daily_active_users: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get daily active users: {str(e)}")


@router.post("/analytics/ai-usage", response_model=List[AiUsagePoint])
async def daily_ai_usage(request: AnalyticsRequest):
    """
    Get daily AI usage statistics.
    Replaces AnalyticsRepository.dailyAiUsage()
    """
    try:
        validate_date_range(request.from_date, request.to_date)

        sql = text("""
            SELECT DATE(created_at) AS day, COUNT(*) AS calls
            FROM audit_logs
            WHERE created_at BETWEEN :from_date AND :to_date
              AND action_type = 'CHAT_SENT'
            GROUP BY day
            ORDER BY day
        """)

        df = pd.read_sql(
            sql,
            engine,
            params={"from_date": request.from_date, "to_date": request.to_date}
        )

        results = []
        for _, row in df.iterrows():
            results.append(AiUsagePoint(
                day=row['day'] if isinstance(row['day'], date) else row['day'].date(),
                calls=int(row['calls'])
            ))

        return results

    except Exception as e:
        logger.error(f"Error in daily_ai_usage: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get AI usage: {str(e)}")


@router.post("/analytics/mood-correlation", response_model=List[MoodCorrelationPoint])
async def mood_correlation(request: AnalyticsRequest):
    """
    Get mood correlation data.
    Replaces AnalyticsRepository.moodCorrelation()
    """
    try:
        validate_date_range(request.from_date, request.to_date)

        sql = text("""
            WITH moods AS (
                SELECT DATE(created_at) AS day, AVG(mood_value)::float8 AS avg_mood
                FROM mood_entries
                WHERE created_at BETWEEN :from_date AND :to_date
                GROUP BY day
            ),
            chats AS (
                SELECT DATE(created_at) AS day, COUNT(*) AS chat_count
                FROM audit_logs
                WHERE created_at BETWEEN :from_date AND :to_date
                  AND action_type = 'CHAT_SENT'
                GROUP BY day
            )
            SELECT d.day,
                   m.avg_mood,
                   COALESCE(c.chat_count, 0) AS chat_count
            FROM (
                SELECT generate_series(:from_date::date, :to_date::date, INTERVAL '1 day')::date AS day
            ) d
            LEFT JOIN moods m ON m.day = d.day
            LEFT JOIN chats c ON c.day = d.day
            ORDER BY d.day
        """)

        try:
            df = pd.read_sql(
                sql,
                engine,
                params={"from_date": request.from_date, "to_date": request.to_date}
            )
        except Exception as e:
            # Fallback if generate_series not supported
            logger.warn("generate_series not supported, using fallback query")
            return mood_correlation_fallback(request.from_date, request.to_date)

        results = []
        for _, row in df.iterrows():
            results.append(MoodCorrelationPoint(
                day=row['day'] if isinstance(row['day'], date) else row['day'].date(),
                avgMood=float(row['avg_mood']) if pd.notna(row['avg_mood']) else None,
                chatCount=int(row['chat_count'])
            ))

        return results

    except Exception as e:
        logger.error(f"Error in mood_correlation: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get mood correlation: {str(e)}")


def mood_correlation_fallback(from_date: datetime, to_date: datetime) -> List[MoodCorrelationPoint]:
    """Fallback method if generate_series not supported"""
    moods_sql = text("""
        SELECT DATE(created_at) AS day, AVG(mood_value)
        FROM mood_entries
        WHERE created_at BETWEEN :from_date AND :to_date
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
    """)

    chats_sql = text("""
        SELECT DATE(created_at) AS day, COUNT(*) AS chat_count
        FROM audit_logs
        WHERE created_at BETWEEN :from_date AND :to_date
          AND action_type = 'CHAT_SENT'
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
    """)

    moods_df = pd.read_sql(moods_sql, engine, params={"from_date": from_date, "to_date": to_date})
    chats_df = pd.read_sql(chats_sql, engine, params={"from_date": from_date, "to_date": to_date})

    # Merge and fill missing days
    all_days = pd.date_range(start=from_date.date(), end=to_date.date(), freq='D')
    results = []

    moods_dict = dict(zip(moods_df['day'], moods_df['avg_mood'])) if not moods_df.empty else {}
    chats_dict = dict(zip(chats_df['day'], chats_df['chat_count'])) if not chats_df.empty else {}

    for day in all_days:
        day_date = day.date()
        results.append(MoodCorrelationPoint(
            day=day_date,
            avgMood=float(moods_dict.get(day_date)) if day_date in moods_dict else None,
            chatCount=int(chats_dict.get(day_date, 0))
        ))

    return results


@router.post("/analytics/user-growth")
async def user_growth(request: AnalyticsRequest):
    """
    Get user growth statistics.
    Replaces AnalyticsRepository.countUsersCreatedBetween()
    """
    try:
        validate_date_range(request.from_date, request.to_date)

        sql = text("""
            SELECT COUNT(*)
            FROM users
            WHERE created_at BETWEEN :from_date AND :to_date
        """)

        with engine.connect() as conn:
            result = conn.execute(sql, {"from_date": request.from_date, "to_date": request.to_date})
            count = result.scalar()

        return {"count": int(count) if count else 0}

    except Exception as e:
        logger.error(f"Error in user_growth: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get user growth: {str(e)}")


@router.post("/analytics/distinct-active-users")
async def distinct_active_users(request: AnalyticsRequest):
    """
    Get distinct active users count.
    Replaces AnalyticsRepository.distinctActiveUsers()
    """
    try:
        validate_date_range(request.from_date, request.to_date)

        sql = text("""
            SELECT COUNT(DISTINCT user_id)
            FROM audit_logs
            WHERE created_at BETWEEN :from_date AND :to_date
        """)

        with engine.connect() as conn:
            result = conn.execute(sql, {"from_date": request.from_date, "to_date": request.to_date})
            count = result.scalar()

        return {"count": int(count) if count else 0}

    except Exception as e:
        logger.error(f"Error in distinct_active_users: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get distinct active users: {str(e)}")
