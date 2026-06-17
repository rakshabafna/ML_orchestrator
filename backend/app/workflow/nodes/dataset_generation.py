import os
import re
import tempfile
import subprocess
from backend.app.models import PipelineState
from backend.app.telemetry import publish_event, publish_log
from backend.app.config import OPENROUTER_API_KEY, DATA_ROOT
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

def _get_raw_data_dir(session_id: str):
    return os.path.join(DATA_ROOT, session_id, "raw")

def dataset_generation_node(state: PipelineState) -> dict:
    session_id = state["session_id"]
    prompt = state["prompt"]
    
    publish_event(session_id, "Sourcing", "STARTED", "Initiating data sourcing")
    publish_log(session_id, "Checking for uploaded datasets...")
    
    raw_dir = _get_raw_data_dir(session_id)
    os.makedirs(raw_dir, exist_ok=True)
    dataset_path = os.path.join(raw_dir, "dataset.csv")
    
    if os.path.exists(dataset_path):
        publish_log(session_id, "Found existing uploaded dataset. Skipping synthetic generation.")
        publish_event(session_id, "Sourcing", "COMPLETED", "Data already exists")
        return {"dataset_path": dataset_path, "current_phase": "Cleaning"}
    
    publish_log(session_id, "No dataset uploaded. Generating synthetic dataset via LLM...")
    publish_event(session_id, "Sourcing", "RUNNING", "Generating synthetic data with Faker")
    
    # LLM via LangChain + OpenRouter
    llm = ChatOpenAI(
        model="openai/gpt-oss-120b:free", # Using a reliable free model
        openai_api_key=OPENROUTER_API_KEY,
        openai_api_base="https://openrouter.ai/api/v1",
        max_tokens=2000
    )
    
    template = """
You are a Data Engineer. The user needs a synthetic dataset for the following objective:
{objective}

Write a standalone Python script using the 'faker' and 'pandas' libraries that generates a highly realistic synthetic dataset with at least 500 rows.
Include at least 6 features (both categorical and numerical) and a clear target column.
The script MUST save the dataset exactly to the path: {path}

IMPORTANT: 
- Return ONLY valid Python code inside a ```python ``` block.
- Do NOT include any explanations outside the code block.
- Ensure the code catches exceptions and prints them.
"""
    
    try:
        response = llm.invoke(template.format(objective=prompt, path=dataset_path.replace("\\", "/")))
        content = response.content
        
        # Extract code
        code_blocks = re.findall(r'```python\n(.*?)```', content, re.DOTALL)
        if not code_blocks:
            # Fallback if no block
            script_code = content.replace('```python', '').replace('```', '')
        else:
            script_code = code_blocks[0]
            
        publish_log(session_id, "Generated Python code for synthetic data. Executing...")
        
        # Execute script
        with tempfile.NamedTemporaryFile('w', suffix='.py', delete=False, encoding='utf-8') as f:
            f.write(script_code)
            script_file = f.name
            
        result = subprocess.run(["python", script_file], capture_output=True, text=True, encoding='utf-8')
        os.unlink(script_file)
        
        if result.returncode != 0:
            publish_log(session_id, f"Error generating data: {result.stderr}")
            publish_event(session_id, "Sourcing", "FAILED", "Failed to run generation script")
            return {"error": "Failed to generate dataset", "dataset_path": None}
            
        publish_log(session_id, f"Synthetic dataset successfully generated at {dataset_path}")
        publish_event(session_id, "Sourcing", "COMPLETED", "Data generated successfully")
        
        return {"dataset_path": dataset_path, "current_phase": "Cleaning"}
        
    except Exception as e:
        publish_log(session_id, f"LLM Generation Error: {str(e)}")
        publish_event(session_id, "Sourcing", "FAILED", "LLM Error")
        return {"error": str(e), "dataset_path": None}
