import os
import json
import pandas as pd
import numpy as np
from sklearn.feature_selection import SelectKBest, mutual_info_classif, mutual_info_regression
from backend.app.models import PipelineState
from backend.app.telemetry import publish_event, publish_log
from backend.app.config import DATA_ROOT

def _get_artifacts_dir(session_id: str):
    return os.path.join(DATA_ROOT, session_id, "artifacts")

def feature_engineering_node(state: PipelineState) -> dict:
    session_id = state["session_id"]
    clean_dataset_path = state.get("clean_dataset_path")
    
    publish_event(session_id, "Feature Eng.", "STARTED", "Starting Feature Engineering")
    publish_log(session_id, "Analyzing correlations and engineering new features...")
    
    if not clean_dataset_path or not os.path.exists(clean_dataset_path):
        return {"error": "Clean dataset not found for Feature Engineering"}
        
    try:
        df = pd.read_csv(clean_dataset_path)
        
        report = {
            "selected_features": [],
            "removed_features": [],
            "correlations": {},
            "outliers_detected": {}
        }
        
        # 1. Detect target (heuristic: last column or explicit fallback)
        target_col = state.get("target_column")
        if not target_col or target_col not in df.columns:
            target_col = df.columns[-1]
            publish_log(session_id, f"Auto-detected target column: {target_col}")
            
        y = df[target_col]
        X = df.drop(columns=[target_col])
        
        # 2. Correlation Analysis
        publish_event(session_id, "Feature Eng.", "RUNNING", "Removing highly correlated features")
        corr_matrix = X.corr().abs()
        upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
        to_drop = [column for column in upper.columns if any(upper[column] > 0.95)]
        
        X = X.drop(columns=to_drop)
        report["removed_features"].extend(to_drop)
        if to_drop:
            publish_log(session_id, f"Removed highly correlated features: {', '.join(to_drop)}")
            
        # 3. Handle outliers (IQR)
        publish_event(session_id, "Feature Eng.", "RUNNING", "Handling outliers")
        for col in X.select_dtypes(include=[np.number]).columns:
            Q1 = X[col].quantile(0.25)
            Q3 = X[col].quantile(0.75)
            IQR = Q3 - Q1
            outlier_condition = ((X[col] < (Q1 - 1.5 * IQR)) | (X[col] > (Q3 + 1.5 * IQR)))
            outlier_count = outlier_condition.sum()
            if outlier_count > 0:
                report["outliers_detected"][col] = int(outlier_count)
                # Cap outliers
                X[col] = np.clip(X[col], Q1 - 1.5 * IQR, Q3 + 1.5 * IQR)
                
        # 4. Feature Selection (SelectKBest)
        publish_event(session_id, "Feature Eng.", "RUNNING", "Selecting top features")
        is_classification = len(y.unique()) < 20 and y.dtype in [np.int64, np.int32, object]
        task_type = "classification" if is_classification else "regression"
        
        # We need to make sure we don't request more k than features
        k = min(20, len(X.columns))
        score_func = mutual_info_classif if task_type == "classification" else mutual_info_regression
        
        selector = SelectKBest(score_func=score_func, k=k)
        selector.fit(X, y)
        
        selected_mask = selector.get_support()
        selected_cols = X.columns[selected_mask].tolist()
        dropped_cols = X.columns[~selected_mask].tolist()
        
        X = X[selected_cols]
        report["selected_features"] = selected_cols
        report["removed_features"].extend(dropped_cols)
        
        # Save engineered dataset
        engineered_df = pd.concat([X, y], axis=1)
        engineered_path = clean_dataset_path.replace("cleaned_dataset.csv", "engineered_dataset.csv")
        engineered_df.to_csv(engineered_path, index=False)
        
        # Save report
        artifacts_dir = _get_artifacts_dir(session_id)
        os.makedirs(artifacts_dir, exist_ok=True)
        report_path = os.path.join(artifacts_dir, "feature_report.json")
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)
            
        publish_log(session_id, f"Selected {len(selected_cols)} features. Removed {len(report['removed_features'])} features total.")
        publish_event(session_id, "Feature Eng.", "COMPLETED", "Feature Engineering finished")
        
        return {
            "feature_engineered_path": engineered_path,
            "feature_report_path": report_path,
            "target_column": target_col,
            "task_type": task_type,
            "current_phase": "Training"
        }
        
    except Exception as e:
        publish_log(session_id, f"Feature Engineering Error: {str(e)}")
        publish_event(session_id, "Feature Eng.", "FAILED", "Error in feature engineering")
        return {"error": str(e)}
