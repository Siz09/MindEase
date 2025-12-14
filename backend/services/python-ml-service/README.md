# Python ML Service

Python microservice for ML model training and serving.

## Overview

This service handles:

- Risk prediction model training
- Mood prediction model training
- Model serving for predictions
- Model registry and versioning

## Endpoints

### Training

- `POST /ml/train/risk-model` - Train risk prediction model
- `POST /ml/train/mood-predictor` - Train mood prediction model

### Prediction

- `POST /ml/predict/risk` - Predict risk using trained model
- `POST /ml/predict/mood` - Predict mood using trained model

### Management

- `GET /ml/models/list` - List available models
- `GET /health` - Health check

## Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Run the service:

```bash
uvicorn main:app --host 0.0.0.0 --port 8005
```

## Environment Variables

- `ML_MODELS_DIR` - Directory to store trained models (default: ./models)
- `PORT` - Service port (default: 8005)
