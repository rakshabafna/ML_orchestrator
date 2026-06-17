import os
import uuid
import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import redis.asyncio as redis
import pandas as pd
import psutil

from backend.app.celery_app import run_orchestration_task, celery_app
from backend.app.database import get_experiment, list_experiments, list_models, create_experiment, delete_experiment, update_experiment
from backend.app.config import REDIS_URL, DATA_ROOT

app = FastAPI(title="Autonomous ML Experiment Orchestrator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_raw_data_dir(session_id: str):
    return os.path.join(DATA_ROOT, session_id, "raw")

def get_clean_data_dir(session_id: str):
    return os.path.join(DATA_ROOT, session_id, "clean")

def get_artifacts_dir(session_id: str):
    return os.path.join(DATA_ROOT, session_id, "artifacts")

from typing import Optional

class OrchestrateRequest(BaseModel):
    prompt: str
    target_metric: str = "accuracy"
    session_id: Optional[str] = None

@app.post("/api/v1/orchestrate")
async def orchestrate(request: OrchestrateRequest):
    session_id = request.session_id or str(uuid.uuid4())
    
    # Register in DB
    create_experiment(session_id, request.prompt, request.target_metric)
    
    # Dispatch async background task using Celery
    task = run_orchestration_task.delay(session_id, request.prompt, request.target_metric)
    
    # Store task ID in Redis for revocation
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    await redis_client.set(f"task:{session_id}", task.id)
    await redis_client.aclose()
    
    return {"session_id": session_id}

@app.post("/api/v1/upload/{session_id}")
async def upload_custom_dataset(session_id: str, file: UploadFile = File(...)):
    try:
        raw_dir = get_raw_data_dir(session_id)
        os.makedirs(raw_dir, exist_ok=True)
        file_path = os.path.join(raw_dir, "dataset.csv")
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        return {"message": "Dataset uploaded successfully", "file_path": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

@app.post("/api/v1/stop/{session_id}")
async def stop_execution(session_id: str):
    try:
        redis_client = redis.from_url(REDIS_URL, decode_responses=True)
        task_id = await redis_client.get(f"task:{session_id}")
        
        if task_id:
            celery_app.control.revoke(task_id, terminate=True, signal='SIGKILL')
            
        await redis_client.publish(f"session_{session_id}", json.dumps({"type": "phase", "content": "Failed"}))
        await redis_client.publish(f"session_{session_id}", json.dumps({"type": "error", "content": "Pipeline execution stopped by user."}))
        await redis_client.aclose()
        
        update_experiment(session_id, status="stopped")
        
        return {"message": "Execution stopped successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/dataset/preview/{session_id}")
async def preview_dataset(session_id: str, stage: str = "clean"):
    if stage == "raw":
        file_path = os.path.join(get_raw_data_dir(session_id), "dataset.csv")
    elif stage == "clean":
        file_path = os.path.join(get_clean_data_dir(session_id), "cleaned_dataset.csv")
    else:
        raise HTTPException(status_code=400, detail="Invalid stage parameter. Must be 'raw' or 'clean'.")
        
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Dataset not found for stage: {stage}")
        
    try:
        df = pd.read_csv(file_path, nrows=10)
        df = df.replace({pd.NA: None, float('nan'): None})
        return {
            "columns": list(df.columns),
            "rows": df.to_dict(orient="records")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing dataset: {str(e)}")

@app.get("/api/v1/download/model/{session_id}")
async def download_model(session_id: str):
    file_path = os.path.join(get_artifacts_dir(session_id), "model.joblib")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Model artifact not found.")
    return FileResponse(path=file_path, filename=f"model.joblib")

@app.get("/api/v1/download/dataset/{session_id}")
async def download_dataset(session_id: str):
    file_path = os.path.join(get_clean_data_dir(session_id), "cleaned_dataset.csv")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Cleaned dataset not found.")
    return FileResponse(path=file_path, filename=f"cleaned_dataset.csv")

@app.get("/api/v1/leaderboard/{session_id}")
async def get_leaderboard(session_id: str):
    file_path = os.path.join(get_artifacts_dir(session_id), "leaderboard.json")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Leaderboard not found.")
        
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading leaderboard: {str(e)}")

# --- Dynamic UI Endpoints ---

@app.get("/api/v1/system/config")
async def get_system_config():
    return {
        "user": "Sanjeev",
        "project": "NeuralFlow Base",
        "version": "v4.0.0-langgraph",
        "region": "local-env"
    }

@app.get("/api/v1/infrastructure/metrics")
async def get_infrastructure_metrics():
    cpu_percent = psutil.cpu_percent(interval=None)
    mem = psutil.virtual_memory()
    
    return {
        "cpu_usage": cpu_percent,
        "memory_usage": mem.percent,
        "active_nodes": 4, 
        "cost_rate": round((cpu_percent / 100.0) * 12.5, 2) 
    }

@app.get("/api/v1/experiments")
async def get_experiments():
    return list_experiments()

@app.delete("/api/v1/experiments/{session_id}")
async def delete_experiment_endpoint(session_id: str):
    delete_experiment(session_id)
    return {"message": "Deleted"}

@app.get("/api/v1/models")
async def get_models():
    return list_models()

@app.get("/api/v1/insights/{session_id}")
async def get_insights(session_id: str):
    """Returns dynamic feature importance from SHAP."""
    file_path = os.path.join(get_artifacts_dir(session_id), "explainability.json")
    if not os.path.exists(file_path):
        return [
            {"label": "Waiting for SHAP analysis...", "width": "0%"}
        ]
        
    try:
        with open(file_path, "r") as f:
            data = json.load(f)
            
        features = data.get("top_features", [])
        scores = data.get("importance_scores", [])
        
        if not features or not scores:
            return []
            
        max_score = max(scores)
        results = []
        for i, feat in enumerate(features):
            width = f"{int((scores[i] / max_score) * 100)}%" if max_score > 0 else "0%"
            results.append({"label": feat, "width": width})
            
        return results
    except Exception as e:
        return [{"label": "Error loading insights", "width": "0%"}]

@app.get("/api/v1/recommendation/{session_id}")
async def get_recommendation(session_id: str):
    """Returns the LLM recommendation markdown."""
    file_path = os.path.join(get_artifacts_dir(session_id), "recommendation.md")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Recommendation not found.")
        
    try:
        with open(file_path, "r") as f:
            content = f.read()
        return {"markdown": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- WebSocket ---

@app.websocket("/api/v1/stream/{session_id}")
async def stream(websocket: WebSocket, session_id: str):
    await websocket.accept()
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    pubsub = redis_client.pubsub()
    await pubsub.subscribe(f"session_{session_id}")
    
    try:
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message:
                await websocket.send_text(message["data"])
            else:
                await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        print(f"Client disconnected from session {session_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await pubsub.unsubscribe(f"session_{session_id}")
        await pubsub.close()
        await redis_client.aclose()
