from typing import TypedDict, Optional, List, Dict, Any
from pydantic import BaseModel

class PipelineState(TypedDict):
    task_id: str
    session_id: str
    prompt: str
    target_metric: str
    
    # Paths
    dataset_path: Optional[str]
    clean_dataset_path: Optional[str]
    feature_engineered_path: Optional[str]
    leaderboard_path: Optional[str]
    tuned_model_path: Optional[str]
    feature_report_path: Optional[str]
    tuning_report_path: Optional[str]
    explainability_path: Optional[str]
    recommendation_path: Optional[str]
    
    # Memory / Outputs
    model_results: List[Dict[str, Any]]
    best_model_name: Optional[str]
    task_type: Optional[str] # "classification" | "regression"
    target_column: Optional[str]
    
    # Meta
    current_phase: str
    logs: List[str]
    error: Optional[str]

class OrchestrateRequest(BaseModel):
    prompt: str
    target_metric: str = "accuracy"
    session_id: Optional[str] = None
