import os
import json
import joblib
import pandas as pd
import shap
import numpy as np
import matplotlib.pyplot as plt
import logging

from backend.app.models import PipelineState
from backend.app.telemetry import publish_event, publish_log
from backend.app.config import DATA_ROOT

logger = logging.getLogger(__name__)

def _get_artifacts_dir(session_id: str):
    return os.path.join(DATA_ROOT, session_id, "artifacts")

def evaluation_node(state: PipelineState) -> dict:
    session_id = state["session_id"]
    engineered_path = state.get("feature_engineered_path")
    model_path = state.get("tuned_model_path")
    target_col = state.get("target_column")
    
    publish_event(session_id, "Deployment", "STARTED", "Starting Model Explainability Analysis")
    
    if not model_path or not os.path.exists(model_path):
        return {"error": "Model not found for explainability"}
        
    try:
        df = pd.read_csv(engineered_path)
        y = df[target_col]
        X = df.drop(columns=[target_col])
        
        # We only take a sample for SHAP to avoid extreme slowness
        X_sample = X.sample(n=min(100, len(X)), random_state=42)
        
        model = joblib.load(model_path)
        
        publish_log(session_id, "Computing SHAP values...")
        
        # Try TreeExplainer first, fallback to KernelExplainer
        try:
            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(X_sample)
        except Exception:
            try:
                # KernelExplainer requires predict function
                explainer = shap.KernelExplainer(model.predict, shap.kmeans(X, 10))
                shap_values = explainer.shap_values(X_sample)
            except Exception as e:
                publish_log(session_id, f"SHAP Explainability failed. Using feature_importances_ if available. {e}")
                shap_values = None
                
        top_features = []
        importance_scores = []
        
        if shap_values is not None:
            # Handle multi-class / list of arrays
            if isinstance(shap_values, list):
                # Take absolute mean across classes and samples
                vals = np.abs(shap_values).mean(axis=0).mean(axis=0)
            else:
                # Handle single array (regression or binary)
                # Ensure it's a 2D array before doing mean(axis=0)
                if len(shap_values.shape) > 1:
                    vals = np.abs(shap_values).mean(axis=0)
                else:
                    vals = np.abs(shap_values)
            
            feature_importance = pd.DataFrame(list(zip(X.columns, vals)), columns=['col_name', 'feature_importance_vals'])
            feature_importance.sort_values(by=['feature_importance_vals'], ascending=False, inplace=True)
            
            top_features = feature_importance['col_name'].head(10).tolist()
            importance_scores = feature_importance['feature_importance_vals'].head(10).tolist()
        elif hasattr(model, 'feature_importances_'):
            vals = model.feature_importances_
            feature_importance = pd.DataFrame(list(zip(X.columns, vals)), columns=['col_name', 'feature_importance_vals'])
            feature_importance.sort_values(by=['feature_importance_vals'], ascending=False, inplace=True)
            
            top_features = feature_importance['col_name'].head(10).tolist()
            importance_scores = feature_importance['feature_importance_vals'].head(10).tolist()
            
        artifacts_dir = _get_artifacts_dir(session_id)
        os.makedirs(artifacts_dir, exist_ok=True)
        
        explain_path = os.path.join(artifacts_dir, "explainability.json")
        with open(explain_path, "w") as f:
            json.dump({
                "top_features": top_features,
                "importance_scores": [float(x) for x in importance_scores]
            }, f, indent=2)
            
        publish_log(session_id, "Explainability analysis completed.")
        
        return {
            "explainability_path": explain_path,
        }
    except Exception as e:
        publish_log(session_id, f"Evaluation Error: {str(e)}")
        return {"error": str(e)}
