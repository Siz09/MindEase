# backend/services/python-background-jobs/models.py
from pydantic import BaseModel
from typing import Optional


class JobResponse(BaseModel):
    """Response model for job execution"""
    success: bool
    message: str
    records_processed: Optional[int] = None
    records_created: Optional[int] = None
    records_deleted: Optional[int] = None
    execution_time_seconds: Optional[float] = None
