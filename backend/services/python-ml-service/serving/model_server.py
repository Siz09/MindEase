# backend/services/python-ml-service/serving/model_server.py
"""
Model serving for ML predictions.
"""
import logging
import pickle
import os
from typing import Dict, Optional
import numpy as np

logger = logging.getLogger(__name__)

MODELS_DIR = os.getenv("ML_MODELS_DIR", "./models")
models_cache = {}


def load_model(model_id: str):
    """Load model from disk or cache"""
    if model_id in models_cache:
        return models_cache[model_id]

    model_path = os.path.join(MODELS_DIR, f"{model_id}.pkl")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model {model_id} not found")

    with open(model_path, 'rb') as f:
        model = pickle.load(f)

    models_cache[model_id] = model
    return model


def predict_risk(model_id: str, features: Dict) -> Dict:
    """
    Predict risk level using trained model.
    """
    try:
        model = load_model(model_id)

        # Convert features to numpy array
        feature_array = np.array([features.get(f"feature_{i}", 0.0) for i in range(10)])
        feature_array = feature_array.reshape(1, -1)

        # Predict
        prediction = model.predict(feature_array)[0]
        probabilities = model.predict_proba(feature_array)[0]
        confidence = float(max(probabilities))

        return {
            "prediction": float(prediction),
            "confidence": confidence,
            "model_id": model_id
        }

    except Exception as e:
        logger.error(f"Error predicting risk: {str(e)}", exc_info=True)
        raise


def predict_mood(model_id: str, features: Dict) -> Dict:
    """
    Predict mood using trained model.
    """
    try:
        model = load_model(model_id)

        # Convert features to numpy array
        feature_array = np.array([features.get(f"feature_{i}", 0.0) for i in range(15)])
        feature_array = feature_array.reshape(1, -1)

        # Predict
        prediction = model.predict(feature_array)[0]

        # Clamp between 1 and 10
        prediction = max(1.0, min(10.0, prediction))

        return {
            "prediction": float(prediction),
            "confidence": None,  # Regression models don't have confidence scores
            "model_id": model_id
        }

    except Exception as e:
        logger.error(f"Error predicting mood: {str(e)}", exc_info=True)
        raise
