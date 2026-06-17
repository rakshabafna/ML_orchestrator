import os
import pandas as pd
from backend.app.models import PipelineState
from backend.app.telemetry import publish_event, publish_log
from backend.app.config import DATA_ROOT
import json
from backend.app.logger import get_logger
from langchain_openai import ChatOpenAI
from backend.app.config import DATA_ROOT, OPENROUTER_API_KEY

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
        
        # --- Intent Extraction ---
        publish_log(session_id, "Extracting intent to determine task type and target column...")
        llm = ChatOpenAI(
            model="openai/gpt-oss-120b:free",
            openai_api_key=OPENROUTER_API_KEY,
            openai_api_base="https://openrouter.ai/api/v1",
            max_tokens=200
        )
        prompt = state.get("prompt", "")
        cols = list(df.columns)
        intent_prompt = f"""
Given the user prompt: "{prompt}"
And the dataset columns: {cols}

Determine the machine learning task.
If the prompt implies predicting a specific column, return that column name and either "classification" or "regression".
If the prompt implies finding segments, clusters, or anomalies without predicting a specific column, return "unsupervised" and set target_column to null.
If you cannot determine, guess the last column as target_column and guess classification/regression based on its name.

Return EXACTLY a JSON object with two keys: "task_type" (string: classification, regression, or unsupervised) and "target_column" (string or null). Do not include any markdown formatting.
"""
        try:
            res = llm.invoke(intent_prompt)
            content = res.content.replace("```json", "").replace("```", "").strip()
            intent = json.loads(content)
            task_type = intent.get("task_type", "classification")
            target_col = intent.get("target_column")
        except Exception as e:
            logger.error(f"Intent extraction failed: {e}")
            task_type = None
            target_col = None
            
        publish_log(session_id, f"Inferred Task: {task_type}, Target: {target_col}")
        
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
        
        return {
            "clean_dataset_path": clean_path, 
            "current_phase": "Feature Eng.",
            "task_type": task_type,
            "target_column": target_col
        }
        
    except Exception as e:
        publish_log(session_id, f"Data Cleaning Error: {str(e)}")
        publish_event(session_id, "Cleaning", "FAILED", "Error during cleaning")
        return {"error": str(e)}
