# backend/services/python-analytics-service/models.py
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import date, datetime


class ActiveUsersPoint(BaseModel):
    """Matches Java ActiveUsersPoint record"""
    day: date
    active_users: int


class AiUsagePoint(BaseModel):
    """Matches Java AiUsagePoint record"""
    day: date
    calls: int


class MoodCorrelationPoint(BaseModel):
    """Matches Java MoodCorrelationPoint record"""
    day: date
    avg_mood: Optional[float]
    chat_count: int


class AnalyticsRequest(BaseModel):
    """Request for analytics queries"""
    from_date: datetime
    to_date: datetime


class MoodPredictRequest(BaseModel):
    """Request for mood prediction"""
    user_id: str
    days: int = 14


class MoodPredictResponse(BaseModel):
    """Response for mood prediction"""
    prediction: Optional[float]
    trend: str  # "improving", "declining", "stable", "insufficient_data"
    insight: str
    slope: Optional[float] = None


class MoodTrendRequest(BaseModel):
    """Request for mood trend"""
    user_id: str
    days: int = 30


class MoodTrendResponse(BaseModel):
    """Response for mood trend"""
    trend: Dict[str, float]  # date -> average mood value


class ChatImpactRequest(BaseModel):
    """Request for chat impact analysis"""
    user_id: str
    days: int = 30


class ChatImpactResponse(BaseModel):
    """Response for chat impact analysis"""
    sessions_with_both_checkins: int
    sessions_improved: int
    average_improvement: float
    improvement_rate: float
