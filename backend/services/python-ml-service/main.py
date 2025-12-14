# backend/services/python-ml-service/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import logging

from models import TrainingRequest, TrainingResponse, PredictionRequest, PredictionResponse
from training.risk_model import train_risk_model
from training.mood_predictor import train_mood_predictor
from serving.model_server import predict_risk, predict_mood
from serving.model_registry import list_models

app = FastAPI(title="MindEase Python ML Service", version="1.0.0")

# CORS configuration
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "python-ml-service"
    }


@app.post("/ml/train/risk-model", response_model=TrainingResponse)
async def train_risk_model_endpoint(
    request: TrainingRequest,
    # Add authentication dependency:
    # user=Depends(verify_token)
):
    """
    Train risk prediction model.
    Requires authentication.
    """
    try:
        result = train_risk_model(request.training_data)
        return TrainingResponse(**result)
    except Exception as e:
        logger.error(f"Error training risk model: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Training failed. Please contact support.")


@app.post("/ml/train/mood-predictor", response_model=TrainingResponse)
async def train_mood_predictor_endpoint(
    request: TrainingRequest,
    # Add authentication dependency:
    # user=Depends(verify_token)
):
    """
    Train mood prediction model.
    Requires authentication.
    """
    try:
        result = train_mood_predictor(request.training_data)
        return TrainingResponse(**result)
    except Exception as e:
        logger.error(f"Error training mood predictor: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Training failed. Please contact support.")


@app.post("/ml/predict/risk", response_model=PredictionResponse)
async def predict_risk_endpoint(request: PredictionRequest):
    """
    Predict risk using trained model.
    """
    try:
        result = predict_risk(request.model_id, request.features)
        return PredictionResponse(**result)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error predicting risk: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Prediction failed. Please contact support.")


@app.post("/ml/predict/mood", response_model=PredictionResponse)
async def predict_mood_endpoint(request: PredictionRequest):
    """
    Predict mood using trained model.
    """
    try:
        result = predict_mood(request.model_id, request.features)
        return PredictionResponse(**result)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error predicting mood: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Prediction failed. Please contact support.")


@app.get("/ml/models/list")
async def list_models_endpoint():
    """
    List available models.
    """
    try:
        models = list_models()
        return {"models": models, "count": len(models)}
    except Exception as e:
        logger.error(f"Error listing models: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to list models. Please contact support.")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8005"))
    uvicorn.run(app, host="0.0.0.0", port=port)
