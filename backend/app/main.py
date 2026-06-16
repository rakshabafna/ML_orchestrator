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

from backend.app.celery_app import run_orchestration_task, celery_app

app = FastAPI(title="Autonomous ML Experiment Orchestrator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

PROJECT_ROOT = "c:/Users/smart/Desktop/ML"
RAW_DATA_DIR = os.path.join(PROJECT_ROOT, "backend", "data", "raw")
CLEAN_DATA_DIR = os.path.join(PROJECT_ROOT, "backend", "data", "clean")
ARTIFACTS_DIR = os.path.join(PROJECT_ROOT, "backend", "artifacts")

class OrchestrateRequest(BaseModel):
    prompt: str
    target_metric: str = "accuracy"

@app.post("/api/v1/orchestrate")
async def orchestrate(request: OrchestrateRequest):
    session_id = str(uuid.uuid4())
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
        os.makedirs(RAW_DATA_DIR, exist_ok=True)
        file_path = os.path.join(RAW_DATA_DIR, f"dataset_{session_id}.csv")
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
        await redis_client.aclose()
        
        if not task_id:
            raise HTTPException(status_code=404, detail="Task not found for this session.")
        
        celery_app.control.revoke(task_id, terminate=True, signal='SIGKILL')
        return {"message": "Execution stopped successfully."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/dataset/preview/{session_id}")
async def preview_dataset(session_id: str, stage: str = "clean"):
    if stage == "raw":
        file_path = os.path.join(RAW_DATA_DIR, f"dataset_{session_id}.csv")
    elif stage == "clean":
        file_path = os.path.join(CLEAN_DATA_DIR, f"cleaned_dataset_{session_id}.csv")
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
    file_path = os.path.join(ARTIFACTS_DIR, f"model_{session_id}.joblib")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Model artifact not found.")
    return FileResponse(path=file_path, filename=f"model_{session_id}.joblib")

@app.get("/api/v1/download/dataset/{session_id}")
async def download_dataset(session_id: str):
    file_path = os.path.join(CLEAN_DATA_DIR, f"cleaned_dataset_{session_id}.csv")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Cleaned dataset not found.")
    return FileResponse(path=file_path, filename=f"cleaned_dataset_{session_id}.csv")

@app.get("/api/v1/leaderboard/{session_id}")
async def get_leaderboard(session_id: str):
    file_path = os.path.join(ARTIFACTS_DIR, f"leaderboard_{session_id}.json")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Leaderboard not found.")
        
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading leaderboard: {str(e)}")

@app.websocket("/api/v1/stream/{session_id}")
async def stream(websocket: WebSocket, session_id: str):
    await websocket.accept()
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    pubsub = redis_client.pubsub()
    await pubsub.subscribe(f"session_{session_id}")
    
    try:
        while True:
            # Poll for messages from Redis Pub/Sub
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message:
                await websocket.send_text(message["data"])
            else:
                # Add a small sleep to avoid blocking the event loop entirely
                await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        print(f"Client disconnected from session {session_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await pubsub.unsubscribe(f"session_{session_id}")
        await pubsub.close()
        await redis_client.aclose()
