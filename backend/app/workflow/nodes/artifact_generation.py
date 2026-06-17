import os
import zipfile
from backend.app.models import PipelineState
from backend.app.telemetry import publish_event, publish_log
from backend.app.config import DATA_ROOT
from backend.app.database import update_experiment, create_model

def _get_artifacts_dir(session_id: str):
    return os.path.join(DATA_ROOT, session_id, "artifacts")

def artifact_generation_node(state: PipelineState) -> dict:
    session_id = state["session_id"]
    publish_event(session_id, "Deployment", "RUNNING", "Generating final artifacts")
    
    artifacts_dir = _get_artifacts_dir(session_id)
    zip_path = os.path.join(artifacts_dir, "experiment_artifacts.zip")
    
    try:
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, _, files in os.walk(artifacts_dir):
                for file in files:
                    if file != "experiment_artifacts.zip":
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, artifacts_dir)
                        zipf.write(file_path, arcname)
                        
        publish_log(session_id, f"Artifacts bundled at {zip_path}")
        publish_event(session_id, "Completed", "COMPLETED", "Pipeline finished successfully")
        
        # Update database
        best_model = state.get("best_model_name", "Unknown")
        
        # Determine score from leaderboard if available
        score = 0.0
        if state.get("model_results") and len(state["model_results"]) > 0:
            score = state["model_results"][0].get("score", 0.0)
            
        update_experiment(
            session_id,
            status="completed",
            best_model=best_model,
            score=score,
            task_type=state.get("task_type"),
            artifact_path=zip_path
        )
        
        create_model(
            model_id=f"model_{session_id[:8]}",
            session_id=session_id,
            name=f"{best_model} Pipeline",
            score=score,
            metric=state.get("target_metric", "Accuracy")
        )
        
        return {"current_phase": "Completed"}
    except Exception as e:
        publish_log(session_id, f"Artifact Generation Error: {str(e)}")
        publish_event(session_id, "Deployment", "FAILED", "Failed to generate artifacts")
        return {"error": str(e)}
