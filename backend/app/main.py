import os
import uuid
import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import redis.asyncio as redis
from backend.app.celery_app import run_orchestration_task

app = FastAPI(title="Autonomous ML Experiment Orchestrator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

class OrchestrateRequest(BaseModel):
    prompt: str
    target_metric: str = "accuracy"

@app.post("/api/v1/orchestrate")
async def orchestrate(request: OrchestrateRequest):
    session_id = str(uuid.uuid4())
    # Dispatch async background task using Celery
    run_orchestration_task.delay(session_id, request.prompt, request.target_metric)
    return {"session_id": session_id}

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
