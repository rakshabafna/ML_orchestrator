import os
import json
import joblib
import pandas as pd
import optuna
import logging
from optuna.integration import OptunaSearchCV
from sklearn.model_selection import train_test_split, GridSearchCV, RandomizedSearchCV
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from xgboost import XGBClassifier, XGBRegressor
from lightgbm import LGBMClassifier, LGBMRegressor
from catboost import CatBoostClassifier, CatBoostRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression

from backend.app.models import PipelineState
from backend.app.telemetry import publish_event, publish_log
from backend.app.config import DATA_ROOT

optuna.logging.set_verbosity(optuna.logging.WARNING)

def _get_artifacts_dir(session_id: str):
    return os.path.join(DATA_ROOT, session_id, "artifacts")

def hyperparameter_tuning_node(state: PipelineState) -> dict:
    session_id = state["session_id"]
    engineered_path = state.get("feature_engineered_path")
    target_col = state.get("target_column")
    task_type = state.get("task_type")
    best_model_name = state.get("best_model_name")
    
    publish_event(session_id, "Tuning", "STARTED", "Starting Hyperparameter Tuning")
    
    if not best_model_name:
        return {"error": "No best model selected"}
        
    df = pd.read_csv(engineered_path)
    y = df[target_col]
    X = df.drop(columns=[target_col])
    
    publish_log(session_id, f"Tuning {best_model_name} via Optuna...")
    
    model = None
    param_distributions = {}
    
    # Map model name to base estimator and Optuna distributions
    if best_model_name == "Random Forest":
        model = RandomForestClassifier() if task_type == "classification" else RandomForestRegressor()
        param_distributions = {
            'n_estimators': optuna.distributions.IntDistribution(50, 300),
            'max_depth': optuna.distributions.IntDistribution(3, 15),
            'min_samples_split': optuna.distributions.IntDistribution(2, 10)
        }
    elif best_model_name == "XGBoost":
        model = XGBClassifier(use_label_encoder=False, eval_metric='logloss') if task_type == "classification" else XGBRegressor()
        param_distributions = {
            'n_estimators': optuna.distributions.IntDistribution(50, 300),
            'max_depth': optuna.distributions.IntDistribution(3, 10),
            'learning_rate': optuna.distributions.FloatDistribution(0.01, 0.3, log=True)
        }
    elif best_model_name == "LightGBM":
        model = LGBMClassifier(verbose=-1) if task_type == "classification" else LGBMRegressor(verbose=-1)
        param_distributions = {
            'n_estimators': optuna.distributions.IntDistribution(50, 300),
            'num_leaves': optuna.distributions.IntDistribution(20, 100),
            'learning_rate': optuna.distributions.FloatDistribution(0.01, 0.3, log=True)
        }
    else:
        # Fallback to base model for un-tuned algorithms
        if task_type == "classification":
            model = LogisticRegression(max_iter=1000)
        else:
            model = LinearRegression()
        publish_log(session_id, f"{best_model_name} does not have Optuna search space configured. Fitting base model.")
        
    try:
        if param_distributions:
            search = OptunaSearchCV(
                estimator=model,
                param_distributions=param_distributions,
                n_trials=20,
                n_jobs=-1,
                random_state=42
            )
            search.fit(X, y)
            final_model = search.best_estimator_
            best_params = search.best_params_
            best_score = search.best_score_
            search_method = "Optuna"
        else:
            final_model = model
            final_model.fit(X, y)
            best_params = {}
            best_score = 0.0 # Placeholder
            search_method = "None"
            
        artifacts_dir = _get_artifacts_dir(session_id)
        os.makedirs(artifacts_dir, exist_ok=True)
        
        # Save Report
        report = {
            "best_parameters": best_params,
            "best_score": best_score,
            "search_method": search_method,
            "n_trials": 20 if param_distributions else 0
        }
        report_path = os.path.join(artifacts_dir, "tuning_report.json")
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
            
        # Save Model
        model_path = os.path.join(artifacts_dir, "model.joblib")
        joblib.dump(final_model, model_path)
        
        publish_log(session_id, f"Hyperparameter tuning finished. Saved to {model_path}")
        publish_event(session_id, "Tuning", "COMPLETED", "Tuning complete")
        
        return {
            "tuning_report_path": report_path,
            "tuned_model_path": model_path,
            "current_phase": "Evaluation"
        }
        
    except Exception as e:
        publish_log(session_id, f"Tuning Error: {str(e)}")
        publish_event(session_id, "Tuning", "FAILED", "Tuning failed")
        return {"error": str(e)}
