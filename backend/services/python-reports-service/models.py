# backend/services/python-reports-service/models.py
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, List, Literal
from datetime import datetime, date


class ReportRequest(BaseModel):
    """Request model for report generation"""
    report_type: Literal["admin_dashboard", "user_insights", "analytics_summary"]
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    user_id: Optional[str] = None
    format: Literal["html", "pdf"] = "html"

    @field_validator('date_to')
    @classmethod
    def validate_date_range(cls, v, info):
        if v and info.data.get('date_from') and v < info.data['date_from']:
            raise ValueError('date_to must be greater than or equal to date_from')
        return v


class ReportResponse(BaseModel):
    """Response model for report generation"""
    report_id: str
    report_type: str
    format: str
    download_url: Optional[str] = None
    generated_at: datetime
    status: Literal["completed", "processing", "failed"]
