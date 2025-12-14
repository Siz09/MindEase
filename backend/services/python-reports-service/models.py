# backend/services/python-reports-service/models.py
from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import datetime, date


class ReportRequest(BaseModel):
    """Request model for report generation"""
    report_type: str  # "admin_dashboard", "user_insights", "analytics_summary"
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    user_id: Optional[str] = None
    format: str = "html"  # "html", "pdf"


class ReportResponse(BaseModel):
    """Response model for report generation"""
    report_id: str
    report_type: str
    format: str
    download_url: Optional[str] = None
    generated_at: datetime
    status: str  # "completed", "processing", "failed"
