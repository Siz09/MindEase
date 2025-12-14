# backend/services/python-ml-service/models.py
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime


class TrainingRequest(BaseModel):
    """Request model for model training"""
    model_type: str  # "risk_model", "mood_predictor", "behavior_analyzer"
    training_data: Optional[Dict] = None
    parameters: Optional[Dict] = None


class TrainingResponse(BaseModel):
    """Response model for model training"""
    model_id: str
    model_type: str
    status: str  # "training", "completed", "failed"
    accuracy: Optional[float] = None
    trained_at: Optional[datetime] = None
    message: str


class PredictionRequest(BaseModel):
    """Request model for predictions"""
    model_id: str
    features: Dict


class PredictionResponse(BaseModel):
    """Response model for predictions"""
    prediction: float
    confidence: Optional[float] = None
    model_id: str
