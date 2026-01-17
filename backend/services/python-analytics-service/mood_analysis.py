# backend/services/python-analytics-service/mood_analysis.py
from fastapi import APIRouter, HTTPException
from typing import Dict, List
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
from sklearn.linear_model import LinearRegression
import os
import logging

from models import (
    MoodPredictRequest,
    MoodPredictResponse,
    MoodTrendRequest,
    MoodTrendResponse,
    ChatImpactRequest,
    ChatImpactResponse
)

router = APIRouter()
logger = logging.getLogger(__name__)

# Database connection
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://mindease:secret@localhost:5432/mindease"
)
engine = create_engine(DATABASE_URL)

# Constants matching Java MoodService
SECONDS_PER_DAY = 86400.0


@router.post("/mood/predict", response_model=MoodPredictResponse)
async def predict_mood(request: MoodPredictRequest):
    """
    Predict mood trend using linear regression.
    Replaces MoodService.predictMood()
    """
    try:
        fourteen_days_ago = datetime.now().replace(tzinfo=None) - timedelta(days=request.days)

        sql = text("""
            SELECT created_at, mood_value
            FROM mood_entries
            WHERE user_id = :user_id
              AND created_at >= :since
            ORDER BY created_at ASC
        """)

        df = pd.read_sql(
            sql,
            engine,
            params={"user_id": request.user_id, "since": fourteen_days_ago}
        )

        if len(df) < 3:
            return MoodPredictResponse(
                prediction=None,
                trend="insufficient_data",
                insight="Keep tracking your mood for a few more days to get personalized insights!"
            )

        # Convert timestamps to days since start
        df['created_at'] = pd.to_datetime(df['created_at'])
        start_time = df['created_at'].iloc[0].timestamp()
        df['days_since_start'] = (df['created_at'].astype(np.int64) // 10**9 - start_time) / SECONDS_PER_DAY

        # Prepare data for linear regression
        X = df[['days_since_start']].values
        y = df['mood_value'].values

        # Fit linear regression model
        model = LinearRegression()
        model.fit(X, y)

        # Check if denominator is too small (stable trend)
        n = len(df)
        sum_x = df['days_since_start'].sum()
        sum_y = df['mood_value'].sum()
        sum_xy = (df['days_since_start'] * df['mood_value']).sum()
        sum_x2 = (df['days_since_start'] ** 2).sum()
        denominator = n * sum_x2 - sum_x * sum_x

        if abs(denominator) < 1e-10:
            last_mood = df['mood_value'].iloc[-1]
            return MoodPredictResponse(
                prediction=float(last_mood),
                trend="stable",
                insight="Your mood has been relatively stable recently.",
                slope=0.0
            )

        # Predict next day
        last_x = df['days_since_start'].iloc[-1]
        next_x = last_x + 1.0
        predicted_value = model.predict([[next_x]])[0]

        # Clamp between 1 and 10
        predicted_value = max(1.0, min(10.0, predicted_value))

        # Determine trend
        slope = model.coef_[0]
        threshold = 0.1  # Matching Java MoodConfig

        if slope > threshold:
            trend = "improving"
            insight = "Your mood seems to be on an upward trend! Keep doing what you're doing."
        elif slope < -threshold:
            trend = "declining"
            insight = "It looks like things have been tough lately. Consider practicing some mindfulness or reaching out to a friend."
        else:
            trend = "stable"
            insight = "Your mood has been relatively stable recently."

        return MoodPredictResponse(
            prediction=round(predicted_value, 1),
            trend=trend,
            insight=insight,
            slope=float(slope)
        )

    except Exception as e:
        logger.error(f"Error in predict_mood: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to predict mood: {str(e)}")


@router.post("/mood/trend", response_model=MoodTrendResponse)
async def get_mood_trend(request: MoodTrendRequest):
    """
    Get mood trend over time.
    Replaces MoodService.getUnifiedMoodTrend()
    """
    try:
        since = datetime.now().replace(tzinfo=None) - timedelta(days=request.days)

        # Get mood entries
        entries_sql = text("""
            SELECT created_at, mood_value
            FROM mood_entries
            WHERE user_id = :user_id
              AND created_at >= :since
            ORDER BY created_at ASC
        """)

        # Get mood check-ins (multiply by 2 to convert 1-5 scale to 1-10)
        checkins_sql = text("""
            SELECT created_at, score * 2 AS mood_value
            FROM mood_checkins
            WHERE user_id = :user_id
              AND created_at >= :since
            ORDER BY created_at ASC
        """)

        entries_df = pd.read_sql(
            entries_sql,
            engine,
            params={"user_id": request.user_id, "since": since}
        )

        checkins_df = pd.read_sql(
            checkins_sql,
            engine,
            params={"user_id": request.user_id, "since": since}
        )

        # Combine and process - handle empty DataFrames to avoid FutureWarning
        dfs_to_concat = []
        if not entries_df.empty:
            dfs_to_concat.append(entries_df)
        if not checkins_df.empty:
            dfs_to_concat.append(checkins_df)

        if not dfs_to_concat:
            return MoodTrendResponse(trend={})

        all_moods = pd.concat(dfs_to_concat, ignore_index=True) if len(dfs_to_concat) > 1 else dfs_to_concat[0]

        all_moods['created_at'] = pd.to_datetime(all_moods['created_at'])
        all_moods['date'] = all_moods['created_at'].dt.date

        # Group by date and calculate average
        trend_df = all_moods.groupby('date')['mood_value'].mean()

        trend_dict = {str(date): float(value) for date, value in trend_df.items()}

        return MoodTrendResponse(trend=trend_dict)

    except Exception as e:
        logger.error(f"Error in get_mood_trend: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get mood trend: {str(e)}")


@router.post("/mood/analyze-impact", response_model=ChatImpactResponse)
async def analyze_chat_impact(request: ChatImpactRequest):
    """
    Analyze chat impact on mood.
    Replaces MoodService.analyzeChatImpact()
    """
    try:
        since = datetime.now().replace(tzinfo=None) - timedelta(days=request.days)

        sql = text("""
            SELECT mc.id, mc.session_id, mc.checkin_type, mc.score, mc.created_at
            FROM mood_checkins mc
            WHERE mc.user_id = :user_id
              AND mc.created_at >= :since
              AND mc.session_id IS NOT NULL
            ORDER BY mc.created_at DESC
        """)

        df = pd.read_sql(
            sql,
            engine,
            params={"user_id": request.user_id, "since": since}
        )

        if df.empty:
            return ChatImpactResponse(
                sessions_with_both_checkins=0,
                sessions_improved=0,
                average_improvement=0.0,
                improvement_rate=0.0
            )

        # Group by session
        sessions_with_both = 0
        sessions_improved = 0
        total_improvement = 0.0

        for session_id, group in df.groupby('session_id'):
            pre_chat = group[group['checkin_type'] == 'pre_chat']
            post_chat = group[group['checkin_type'] == 'post_chat']

            if not pre_chat.empty and not post_chat.empty:
                sessions_with_both += 1
                pre_score = pre_chat.iloc[0]['score']
                post_score = post_chat.iloc[0]['score']
                improvement = post_score - pre_score
                total_improvement += improvement

                if improvement > 0:
                    sessions_improved += 1

        avg_improvement = total_improvement / sessions_with_both if sessions_with_both > 0 else 0.0
        improvement_rate = sessions_improved / sessions_with_both if sessions_with_both > 0 else 0.0

        return ChatImpactResponse(
            sessions_with_both_checkins=sessions_with_both,
            sessions_improved=sessions_improved,
            average_improvement=float(avg_improvement),
            improvement_rate=float(improvement_rate)
        )

    except Exception as e:
        logger.error(f"Error in analyze_chat_impact: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to analyze chat impact: {str(e)}")
