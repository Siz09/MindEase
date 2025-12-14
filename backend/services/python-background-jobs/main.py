# backend/services/python-background-jobs/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import logging

from retention import cleanup_old_data
from inactivity import detect_inactive_users
from auto_mood import create_auto_entries
from models import JobResponse

app = FastAPI(title="MindEase Python Background Jobs Service", version="1.0.0")

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


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "python-background-jobs"
    }


@app.post("/jobs/retention/trigger", response_model=JobResponse)
async def trigger_retention_cleanup():
    """
    Manual trigger for retention cleanup job.
    Replaces RetentionPolicyService.manualCleanup()
    """
    try:
        result = cleanup_old_data()
        return JobResponse(**result)
    except Exception as e:
        logger.error(f"Error triggering retention cleanup: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Retention cleanup failed: {str(e)}")


@app.post("/jobs/inactivity/trigger", response_model=JobResponse)
async def trigger_inactivity_detection():
    """
    Manual trigger for inactivity detection job.
    Replaces InactivityDetectionService.manualTrigger()
    """
    try:
        result = detect_inactive_users()
        return JobResponse(**result)
    except Exception as e:
        logger.error(f"Error triggering inactivity detection: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Inactivity detection failed: {str(e)}")


@app.post("/jobs/auto-mood/trigger", response_model=JobResponse)
async def trigger_auto_mood_creation():
    """
    Manual trigger for auto mood entry creation job.
    Replaces AutoMoodService.manualTrigger()
    """
    try:
        result = create_auto_entries()
        return JobResponse(**result)
    except Exception as e:
        logger.error(f"Error triggering auto mood creation: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Auto mood creation failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8003"))
    uvicorn.run(app, host="0.0.0.0", port=port)
