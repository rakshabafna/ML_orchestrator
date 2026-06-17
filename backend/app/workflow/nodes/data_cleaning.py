import os
import pandas as pd
from backend.app.models import PipelineState
from backend.app.telemetry import publish_event, publish_log
from backend.app.config import DATA_ROOT
from backend.app.logger import get_logger

logger = get_logger(__name__)

def _get_clean_data_dir(session_id: str):
    return os.path.join(DATA_ROOT, session_id, "clean")

def data_cleaning_node(state: PipelineState) -> dict:
    session_id = state["session_id"]
    dataset_path = state.get("dataset_path")
    
    publish_event(session_id, "Cleaning", "STARTED", "Starting data cleaning and standardization")
    publish_log(session_id, f"Loading raw dataset from {dataset_path}")
    
    if not dataset_path or not os.path.exists(dataset_path):
        msg = f"Dataset not found at {dataset_path}"
        publish_log(session_id, f"ERROR: {msg}")
        publish_event(session_id, "Cleaning", "FAILED", "Dataset missing")
        return {"error": msg}
        
    try:
        df = pd.read_csv(dataset_path)
        publish_log(session_id, f"Loaded {len(df)} rows and {len(df.columns)} columns.")
        
        # 1. Handle Missing Values
        publish_event(session_id, "Cleaning", "RUNNING", "Handling missing values")
        publish_log(session_id, "Imputing missing numerical values with median and categorical with mode.")
        
        num_cols = df.select_dtypes(include=['number']).columns
        cat_cols = df.select_dtypes(exclude=['number']).columns
        
        for col in num_cols:
            if df[col].isnull().any():
                df[col] = df[col].fillna(df[col].median())
                
        for col in cat_cols:
            if df[col].isnull().any():
                df[col] = df[col].fillna(df[col].mode()[0])
                
        # 2. Encode Categoricals
        publish_event(session_id, "Cleaning", "RUNNING", "Encoding categorical variables")
        for col in cat_cols:
            if df[col].nunique() < 20: # OHE for low cardinality
                publish_log(session_id, f"One-hot encoding column: {col}")
                df = pd.get_dummies(df, columns=[col], drop_first=True)
            else: # Label encode high cardinality
                publish_log(session_id, f"Label encoding high-cardinality column: {col}")
                df[col] = df[col].astype('category').cat.codes
                
        # Boolean to int
        for col in df.columns:
            if df[col].dtype == bool:
                df[col] = df[col].astype(int)
                
        clean_dir = _get_clean_data_dir(session_id)
        os.makedirs(clean_dir, exist_ok=True)
        clean_path = os.path.join(clean_dir, "cleaned_dataset.csv")
        
        df.to_csv(clean_path, index=False)
        
        publish_log(session_id, f"Successfully saved cleaned dataset to {clean_path}")
        publish_event(session_id, "Cleaning", "COMPLETED", "Data cleaning finished")
        
        return {"clean_dataset_path": clean_path, "current_phase": "Feature Eng."}
        
    except Exception as e:
        publish_log(session_id, f"Data Cleaning Error: {str(e)}")
        publish_event(session_id, "Cleaning", "FAILED", "Error during cleaning")
        return {"error": str(e)}
