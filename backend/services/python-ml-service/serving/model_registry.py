# backend/services/python-ml-service/serving/model_registry.py
"""
Model registry for versioning and management.
"""
import logging
import os
from typing import List, Dict
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

MODELS_DIR = os.path.abspath(os.getenv("ML_MODELS_DIR", "./models"))
# Optionally add validation to ensure MODELS_DIR is within an expected parent directory


def list_models() -> List[Dict]:
    """
    List all available models.
    """
    models = []

    if not os.path.exists(MODELS_DIR):
        return models

    if not os.path.isdir(MODELS_DIR):
        logger.warning(f"MODELS_DIR is not a directory: {MODELS_DIR}")
        return models

    try:
        filenames = os.listdir(MODELS_DIR)
    except PermissionError:
        logger.error(f"Permission denied reading models directory: {MODELS_DIR}")
        return models

    for filename in filenames:
        if filename.endswith('.pkl'):
            model_id = filename[:-4]  # Remove .pkl extension
            model_path = os.path.join(MODELS_DIR, filename)

            try:
                stat = os.stat(model_path)
            except (FileNotFoundError, OSError) as e:
                logger.warning(f"Could not stat model file {filename}: {e}")
                continue

            models.append({
                "model_id": model_id,
                "model_type": model_id.split('_')[0] if '_' in model_id else "unknown",
                "modified_at": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
                "size_bytes": stat.st_size
            })

    return models
