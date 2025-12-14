# backend/services/python-ml-service/training/mood_predictor.py
"""
Mood prediction model training.
Trains a model to predict user mood based on historical data.
"""
import logging
import pickle
import os
from datetime import datetime
from typing import Dict, Optional
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import numpy as np

logger = logging.getLogger(__name__)

MODELS_DIR = os.getenv("ML_MODELS_DIR", "./models")


def train_mood_predictor(training_data: Optional[Dict] = None) -> Dict:
    """
    Train mood prediction model.
    """
    logger.info("Starting mood predictor training")

    try:
        # Mock training data - in production, fetch from database
        if training_data is None:
            # Generate synthetic training data
            n_samples = 1000
            X = np.random.rand(n_samples, 15)  # 15 features
            y = np.random.uniform(1, 10, n_samples)  # Mood values 1-10
        else:
            # Use provided training data
            X = np.array(training_data.get("features", []))
            y = np.array(training_data.get("labels", []))

            # Validate training data
            if X.size == 0 or y.size == 0:
                raise ValueError("Training data must contain non-empty 'features' and 'labels'")
            if X.shape[0] != y.shape[0]:
                raise ValueError(f"Features and labels must have same number of samples. Got {X.shape[0]} and {y.shape[0]}")
            if len(X.shape) != 2:
                raise ValueError(f"Features must be 2D array, got shape {X.shape}")

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        # Train model
        model = GradientBoostingRegressor(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)

        # Evaluate
        y_pred = model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)

        logger.info(f"Mood predictor training completed with R²: {r2:.4f}, MSE: {mse:.4f}")

        # Save model
        os.makedirs(MODELS_DIR, exist_ok=True)
        model_id = f"mood_predictor_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        model_path = os.path.join(MODELS_DIR, f"{model_id}.pkl")

        with open(model_path, 'wb') as f:
            pickle.dump(model, f)

        return {
            "model_id": model_id,
            "model_type": "mood_predictor",
            "status": "completed",
            "accuracy": float(r2),  # Use R² as accuracy metric
            "trained_at": datetime.now().isoformat(),
            "message": f"Mood predictor trained successfully with R²: {r2:.2%}"
        }

    except Exception as e:
        logger.error(f"Error training mood predictor: {str(e)}", exc_info=True)
        return {
            "model_id": "",
            "model_type": "mood_predictor",
            "status": "failed",
            "accuracy": None,
            "trained_at": None,
            "message": f"Training failed: {str(e)}"
        }
