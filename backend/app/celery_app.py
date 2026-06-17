import os
import json
from celery import Celery
from backend.app.workflow.graph import run_pipeline
from backend.app.database import update_experiment
from backend.app.config import REDIS_URL
from backend.app.telemetry import publish_phase, publish_event

celery_app = Celery(
    "ml_orchestrator",
    broker=REDIS_URL,
    backend=REDIS_URL
)

@celery_app.task(name="run_orchestration_task")
def run_orchestration_task(session_id: str, dataset_prompt: str, target_metric: str = "accuracy"):
    """
    Celery background task to run the LangGraph pipeline.
    """
    publish_phase(session_id, "Idle")
    publish_event(session_id, "System", "STARTED", "Pipeline initialized.")
    
    try:
        run_pipeline(session_id, dataset_prompt, target_metric)
        return "Success"
    except Exception as e:
        publish_event(session_id, "System", "FAILED", str(e))
        publish_phase(session_id, "Failed")
        update_experiment(session_id, status="failed")
        raise e
