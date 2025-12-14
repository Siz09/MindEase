# backend/services/python-reports-service/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import os
import logging

from models import ReportRequest, ReportResponse
from reports import (
    generate_admin_dashboard_report,
    generate_user_insights_report,
    generate_analytics_summary_report
)

app = FastAPI(title="MindEase Python Reports Service", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# In-memory report storage (use database in production)
reports_store = {}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "python-reports-service"
    }


@app.post("/reports/admin/dashboard", response_model=ReportResponse)
async def generate_admin_dashboard(request: ReportRequest):
    """
    Generate admin dashboard report.
    """
    try:
        # Mock data - in production, fetch from database
        data = {
            "active_users": 100,
            "signups": 50,
            "crisis_flags": 5,
            "ai_usage": 1000
        }

        result = generate_admin_dashboard_report(data, request.format)
        reports_store[result["report_id"]] = result

        return ReportResponse(**result)

    except Exception as e:
        logger.error(f"Error generating admin dashboard report: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


@app.post("/reports/user/insights", response_model=ReportResponse)
async def generate_user_insights(request: ReportRequest):
    """
    Generate user insights report.
    """
    if not request.user_id:
        raise HTTPException(status_code=400, detail="user_id is required")

    try:
        # Mock data - in production, fetch from database
        data = {
            "mood_trend": "Your mood has been improving over the last 7 days.",
            "activity_summary": "You've been active 5 out of 7 days this week."
        }

        result = generate_user_insights_report(request.user_id, data, request.format)
        reports_store[result["report_id"]] = result

        return ReportResponse(**result)

    except Exception as e:
        logger.error(f"Error generating user insights report: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


@app.post("/reports/analytics/summary", response_model=ReportResponse)
async def generate_analytics_summary(request: ReportRequest):
    """
    Generate analytics summary report.
    """
    try:
        # Mock data - in production, fetch from database
        data = {
            "metrics": {
                "Total Users": 1000,
                "Active Users (30d)": 500,
                "Total Chat Sessions": 5000,
                "Average Mood Score": 6.5
            }
        }

        result = generate_analytics_summary_report(data, request.format)
        reports_store[result["report_id"]] = result

        return ReportResponse(**result)

    except Exception as e:
        logger.error(f"Error generating analytics summary report: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


@app.get("/reports/{report_id}/download", response_class=HTMLResponse)
async def download_report(report_id: str):
    """
    Download generated report.
    """
    if report_id not in reports_store:
        raise HTTPException(status_code=404, detail="Report not found")

    report = reports_store[report_id]
    if report["format"] == "html":
        return HTMLResponse(content=report["content"])
    else:
        raise HTTPException(status_code=400, detail="PDF format not yet implemented")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8004"))
    uvicorn.run(app, host="0.0.0.0", port=port)
