# backend/services/python-ml-service/training/risk_model.py
"""
Risk prediction model training.
Trains a model to predict user risk levels based on message content and history.
"""
import logging
import pickle
import os
from datetime import datetime
from typing import Dict, Optional
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

MODELS_DIR = os.getenv("ML_MODELS_DIR", "./models")


def train_risk_model(training_data: Optional[Dict] = None) -> Dict:
    """
    Train risk prediction model.
    """
    logger.info("Starting risk model training")

    try:
        # Mock training data - in production, fetch from database
        if training_data is None:
            # Generate synthetic training data
            n_samples = 1000
            X = np.random.rand(n_samples, 10)  # 10 features
            y = np.random.randint(0, 5, n_samples)  # 5 risk levels
        else:
            # Use provided training data
            X = np.array(training_data.get("features", []))
            y = np.array(training_data.get("labels", []))

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        # Train model
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)

        # Evaluate
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)

        logger.info(f"Risk model training completed with accuracy: {accuracy:.4f}")

        # Save model
        os.makedirs(MODELS_DIR, exist_ok=True)
        model_id = f"risk_model_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        model_path = os.path.join(MODELS_DIR, f"{model_id}.pkl")

        with open(model_path, 'wb') as f:
            pickle.dump(model, f)

        return {
            "model_id": model_id,
            "model_type": "risk_model",
            "status": "completed",
            "accuracy": float(accuracy),
            "trained_at": datetime.now(),
            "message": f"Risk model trained successfully with {accuracy:.2%} accuracy"
        }

    except Exception as e:
        logger.error(f"Error training risk model: {str(e)}", exc_info=True)
        return {
            "model_id": "",
            "model_type": "risk_model",
            "status": "failed",
            "accuracy": None,
            "trained_at": None,
            "message": f"Training failed: {str(e)}"
        }
