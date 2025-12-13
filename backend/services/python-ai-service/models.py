# backend/services/python-ai-service/models.py
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum


class RiskLevel(str, Enum):
    """Risk level classification matching Java RiskLevel enum"""
    NONE = "NONE"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class Message(BaseModel):
    """Message model matching Java Message entity"""
    content: str
    is_user_message: bool


class ChatRequest(BaseModel):
    """Request model for chat generation"""
    message: str
    user_id: str
    history: List[Message] = []
    user_context: Optional[Dict[str, str]] = None


class ChatResponse(BaseModel):
    """Response model matching Java ChatResponse DTO"""
    content: str
    is_crisis: bool
    provider: str
    timestamp: Optional[datetime] = None
    risk_level: Optional[RiskLevel] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class JournalSummaryRequest(BaseModel):
    """Request model for journal summary generation"""
    content: str


class JournalSummaryResponse(BaseModel):
    """Response model for journal summary"""
    summary: str


class MoodInsightRequest(BaseModel):
    """Request model for mood insight generation"""
    content: str


class MoodInsightResponse(BaseModel):
    """Response model for mood insight"""
    insight: str


class SafetyClassificationRequest(BaseModel):
    """Request model for safety classification"""
    content: str
    recent_history: List[Message] = []


class SafetyClassificationResponse(BaseModel):
    """Response model for safety classification"""
    risk_level: RiskLevel
    confidence: Optional[float] = None
    detected_keywords: List[str] = []
