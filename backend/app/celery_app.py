import os
import json
from celery import Celery
from backend.app.agents.workflow import run_workflow
from backend.app.registry import update_experiment_status

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "ml_orchestrator",
    broker=REDIS_URL,
    backend=REDIS_URL
)

@celery_app.task(name="run_orchestration_task")
def run_orchestration_task(session_id: str, dataset_prompt: str, target_metric: str = "accuracy"):
    """
    Celery background task to run the ML multi-agent pipeline.
    """
    import redis
    r = redis.from_url(REDIS_URL)
    
    # Notify that the session has started
    r.publish(f"session_{session_id}", json.dumps({"type": "status", "content": "Pipeline initialized."}))
    
    try:
        result = run_workflow(session_id, dataset_prompt)
        r.publish(f"session_{session_id}", json.dumps({"type": "status", "content": "Pipeline completed successfully."}))
        update_experiment_status(session_id, "Completed")
        return str(result)
    except Exception as e:
        r.publish(f"session_{session_id}", json.dumps({"type": "error", "content": str(e)}))
        update_experiment_status(session_id, "Failed")
        raise e
