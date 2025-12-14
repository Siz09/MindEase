# backend/services/python-ml-service/serving/model_registry.py
"""
Model registry for versioning and management.
"""
import logging
import os
from typing import List, Dict
from datetime import datetime

logger = logging.getLogger(__name__)

MODELS_DIR = os.getenv("ML_MODELS_DIR", "./models")


def list_models() -> List[Dict]:
    """
    List all available models.
    """
    models = []

    if not os.path.exists(MODELS_DIR):
        return models

    for filename in os.listdir(MODELS_DIR):
        if filename.endswith('.pkl'):
            model_id = filename[:-4]  # Remove .pkl extension
            model_path = os.path.join(MODELS_DIR, filename)
            stat = os.stat(model_path)

            models.append({
                "model_id": model_id,
                "model_type": model_id.split('_')[0] if '_' in model_id else "unknown",
                "created_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "size_bytes": stat.st_size
            })

    return models
