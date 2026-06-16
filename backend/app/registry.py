import os
import json
import uuid
from datetime import datetime

REGISTRY_FILE = os.path.join(os.path.dirname(__file__), "..", "artifacts", "registry.json")

def _load_registry():
    if not os.path.exists(REGISTRY_FILE):
        os.makedirs(os.path.dirname(REGISTRY_FILE), exist_ok=True)
        return {"experiments": [], "models": []}
    with open(REGISTRY_FILE, "r") as f:
        try:
            return json.load(f)
        except:
            return {"experiments": [], "models": []}

def _save_registry(data):
    os.makedirs(os.path.dirname(REGISTRY_FILE), exist_ok=True)
    with open(REGISTRY_FILE, "w") as f:
        json.dump(data, f, indent=2)

def register_experiment(session_id: str, prompt: str, target_metric: str, status: str = "running"):
    data = _load_registry()
    
    # Check if exists
    for exp in data["experiments"]:
        if exp["id"] == session_id:
            exp["status"] = status
            exp["updated_at"] = datetime.utcnow().isoformat()
            _save_registry(data)
            return
            
    # New experiment
    exp = {
        "id": session_id,
        "name": f"Exp-{session_id[:6]}",
        "objective": prompt,
        "metric": target_metric,
        "status": status,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    data["experiments"].append(exp)
    _save_registry(data)

def update_experiment_status(session_id: str, status: str):
    data = _load_registry()
    for exp in data["experiments"]:
        if exp["id"] == session_id:
            exp["status"] = status
            exp["updated_at"] = datetime.utcnow().isoformat()
            _save_registry(data)
            return

def register_model(session_id: str, name: str, score: float, metric: str = "Accuracy"):
    data = _load_registry()
    model_id = f"mdl-{str(uuid.uuid4())[:8]}"
    model = {
        "id": model_id,
        "session_id": session_id,
        "name": name,
        "version": "v1.0.0",
        "score": score,
        "metric": metric,
        "status": "Deployed",
        "created_at": datetime.utcnow().isoformat()
    }
    data["models"].append(model)
    _save_registry(data)

def get_all_experiments():
    return _load_registry()["experiments"]

def get_all_models():
    return _load_registry()["models"]
