# backend/services/python-reports-service/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from threading import Lock
from collections import OrderedDict
from enum import Enum
import os
import logging

from models import ReportRequest, ReportResponse
from reports import (
    generate_admin_dashboard_report,
    generate_user_insights_report,
    generate_analytics_summary_report
)

app = FastAPI(title="MindEase Python Reports Service", version="1.0.0")

# Load allowed origins from environment
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS != [""] else ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Thread-safe report storage with bounded size
reports_lock = Lock()
reports_store = OrderedDict()
MAX_REPORTS = 1000


def store_report(report_id: str, report: dict):
    """Thread-safe report storage with eviction policy"""
    with reports_lock:
        reports_store[report_id] = report
        if len(reports_store) > MAX_REPORTS:
            reports_store.popitem(last=False)  # Remove oldest


def get_report(report_id: str):
    """Thread-safe report retrieval"""
    with reports_lock:
        return reports_store.get(report_id)


class ReportFormat(str, Enum):
    HTML = "html"
    PDF = "pdf"


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "python-reports-service"
    }


@app.post("/reports/admin/dashboard", response_model=ReportResponse)
async def generate_admin_dashboard(
    request: ReportRequest,
    # Add authentication dependency here, e.g.:
    # current_user: User = Depends(get_current_admin_user)
):
    """
    Generate admin dashboard report.
    Requires admin authentication.
    """
    # Validate format
    if request.format not in [ReportFormat.HTML, ReportFormat.PDF]:
        raise HTTPException(status_code=400, detail="Invalid format")

    try:
        # Mock data - in production, fetch from database
        if os.getenv("ENVIRONMENT") == "production":
            raise HTTPException(status_code=500, detail="Mock data not available in production")

        data = {
            "active_users": 100,
            "signups": 50,
            "crisis_flags": 5,
            "ai_usage": 1000
        }

        result = generate_admin_dashboard_report(data)
        store_report(result["report_id"], result)

        return ReportResponse(**result)

    except HTTPException:
        raise
    except Exception:
        logger.error("Error generating admin dashboard report", exc_info=True)
        raise HTTPException(status_code=500, detail="Report generation failed")


@app.post("/reports/user/insights", response_model=ReportResponse)
async def generate_user_insights(
    request: ReportRequest,
    # Add authentication dependency:
    # current_user: User = Depends(get_current_user)
):
    """
    Generate user insights report.
    Users can only access their own insights.
    """
    if not request.user_id:
        raise HTTPException(status_code=400, detail="user_id is required")

    # Add authorization check:
    # if current_user.id != request.user_id:
    #     raise HTTPException(status_code=403, detail="Forbidden")

    try:
        # Mock data - in production, fetch from database
        if os.getenv("ENVIRONMENT") == "production":
            raise HTTPException(status_code=500, detail="Mock data not available in production")

        data = {
            "mood_trend": "Your mood has been improving over the last 7 days.",
            "activity_summary": "You've been active 5 out of 7 days this week."
        }

        result = generate_user_insights_report(request.user_id, data)
        store_report(result["report_id"], result)

        return ReportResponse(**result)

    except HTTPException:
        raise
    except Exception:
        # Avoid logging PII (user_id)
        logger.error("Error generating user insights report", exc_info=True)
        raise HTTPException(status_code=500, detail="Report generation failed")


@app.post("/reports/analytics/summary", response_model=ReportResponse)
async def generate_analytics_summary(
    request: ReportRequest,
    # Add authentication dependency:
    # current_user: User = Depends(get_current_admin_user)
):
    """
    Generate analytics summary report.
    Requires admin authentication.
    """
    try:
        # Mock data - in production, fetch from database
        if os.getenv("ENVIRONMENT") == "production":
            raise HTTPException(status_code=500, detail="Mock data not available in production")

        data = {
            "metrics": {
                "Total Users": 1000,
                "Active Users (30d)": 500,
                "Total Chat Sessions": 5000,
                "Average Mood Score": 6.5
            }
        }

        result = generate_analytics_summary_report(data)
        store_report(result["report_id"], result)

        return ReportResponse(**result)

    except HTTPException:
        raise
    except Exception:
        logger.error("Error generating analytics summary report", exc_info=True)
        raise HTTPException(status_code=500, detail="Report generation failed")


@app.get("/reports/{report_id}/download")
async def download_report(
    report_id: str,
    # Add authentication:
    # current_user: User = Depends(get_current_user)
):
    """
    Download generated report.
    Users can only download their own reports.
    """
    report = get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Add authorization check:
    # if not can_access_report(current_user, report):
    #     raise HTTPException(status_code=403, detail="Forbidden")

    if report["format"] == "html":
        return HTMLResponse(
            content=report["content"],
            headers={
                "Content-Disposition": f'attachment; filename="report_{report_id}.html"',
                "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'"
            }
        )
    else:
        raise HTTPException(status_code=501, detail="PDF format not yet implemented")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8004"))
    uvicorn.run(app, host="0.0.0.0", port=port)
