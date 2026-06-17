import os
import json
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score, mean_absolute_error, mean_squared_error, r2_score
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, ExtraTreesClassifier, AdaBoostClassifier
from xgboost import XGBClassifier, XGBRegressor
from lightgbm import LGBMClassifier, LGBMRegressor
from catboost import CatBoostClassifier, CatBoostRegressor
import warnings
warnings.filterwarnings('ignore')

from backend.app.models import PipelineState
from backend.app.telemetry import publish_event, publish_log
from backend.app.config import DATA_ROOT
from backend.app.logger import get_logger

logger = get_logger(__name__)

def _get_artifacts_dir(session_id: str):
    return os.path.join(DATA_ROOT, session_id, "artifacts")

def model_selection_node(state: PipelineState) -> dict:
    session_id = state["session_id"]
    engineered_path = state.get("feature_engineered_path")
    target_col = state.get("target_column")
    task_type = state.get("task_type")
    
    publish_event(session_id, "Training", "STARTED", "Starting Model Selection")
    
    if not engineered_path or not os.path.exists(engineered_path):
        return {"error": "Engineered dataset not found"}
        
    try:
        df = pd.read_csv(engineered_path)
        y = df[target_col]
        X = df.drop(columns=[target_col])
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        results = []
        
        if task_type == "classification":
            publish_log(session_id, "Evaluating Classification Models...")
            models = {
                "Logistic Regression": LogisticRegression(max_iter=1000),
                "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42),
                "Extra Trees": ExtraTreesClassifier(n_estimators=100, random_state=42),
                "AdaBoost": AdaBoostClassifier(n_estimators=100, random_state=42),
                "XGBoost": XGBClassifier(use_label_encoder=False, eval_metric='logloss', random_state=42),
                "LightGBM": LGBMClassifier(random_state=42, verbose=-1),
                "CatBoost": CatBoostClassifier(verbose=0, random_state=42)
            }
            
            for name, model in models.items():
                publish_log(session_id, f"Training {name}...")
                model.fit(X_train, y_train)
                preds = model.predict(X_test)
                
                acc = float(accuracy_score(y_test, preds))
                f1 = float(f1_score(y_test, preds, average='weighted'))
                
                try:
                    proba = model.predict_proba(X_test)
                    roc_auc = float(roc_auc_score(y_test, proba, multi_class='ovr')) if len(y.unique()) > 2 else float(roc_auc_score(y_test, proba[:, 1]))
                except:
                    roc_auc = 0.0
                    
                results.append({
                    "model_name": name,
                    "score": acc, # Default sort by accuracy
                    "f1": f1,
                    "roc_auc": roc_auc
                })
        else:
            publish_log(session_id, "Evaluating Regression Models...")
            models = {
                "Linear Regression": LinearRegression(),
                "Random Forest": RandomForestRegressor(n_estimators=100, random_state=42),
                "XGBoost": XGBRegressor(random_state=42),
                "LightGBM": LGBMRegressor(random_state=42, verbose=-1),
                "CatBoost": CatBoostRegressor(verbose=0, random_state=42)
            }
            
            for name, model in models.items():
                publish_log(session_id, f"Training {name}...")
                model.fit(X_train, y_train)
                preds = model.predict(X_test)
                
                mae = float(mean_absolute_error(y_test, preds))
                rmse = float(mean_squared_error(y_test, preds, squared=False))
                r2 = float(r2_score(y_test, preds))
                
                results.append({
                    "model_name": name,
                    "score": r2, # Default sort by R2
                    "mae": mae,
                    "rmse": rmse
                })
                
        # Sort descending by score
        results.sort(key=lambda x: x["score"], reverse=True)
        best_model = results[0]["model_name"]
        
        # Save leaderboard
        artifacts_dir = _get_artifacts_dir(session_id)
        os.makedirs(artifacts_dir, exist_ok=True)
        leaderboard_path = os.path.join(artifacts_dir, "leaderboard.json")
        with open(leaderboard_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)
            
        publish_log(session_id, f"Model selection complete. Best model: {best_model} with score {results[0]['score']:.4f}")
        publish_event(session_id, "Training", "COMPLETED", "Model evaluation finished")
        
        return {
            "model_results": results,
            "leaderboard_path": leaderboard_path,
            "best_model_name": best_model,
            "current_phase": "Tuning" # We'll jump to tuning next
        }
        
    except Exception as e:
        publish_log(session_id, f"Model Selection Error: {str(e)}")
        publish_event(session_id, "Training", "FAILED", "Evaluation failed")
        return {"error": str(e)}
