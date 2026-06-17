import os
import json
from langchain_openai import ChatOpenAI
from backend.app.models import PipelineState
from backend.app.telemetry import publish_event, publish_log
from backend.app.config import DATA_ROOT, OPENROUTER_API_KEY

def _get_artifacts_dir(session_id: str):
    return os.path.join(DATA_ROOT, session_id, "artifacts")

def recommendation_node(state: PipelineState) -> dict:
    session_id = state["session_id"]
    leaderboard_path = state.get("leaderboard_path")
    best_model_name = state.get("best_model_name")
    
    if not leaderboard_path or not best_model_name:
        return {}
        
    publish_log(session_id, "Generating Model Recommendation Report via LLM...")
    
    try:
        with open(leaderboard_path, "r") as f:
            leaderboard = json.load(f)
            
        llm = ChatOpenAI(
            model="google/gemma-4-31b-it:free",
            openai_api_key=OPENROUTER_API_KEY,
            openai_api_base="https://openrouter.ai/api/v1",
            max_tokens=1000
        )
        
        prompt = f"""
You are a Principal ML Engineer. You just ran an AutoML pipeline.
Here is the leaderboard of models trained:
{json.dumps(leaderboard, indent=2)}

The best model selected was: {best_model_name}.

Please write a brief 2-paragraph executive summary explaining WHY this model won, and suggest 1-2 alternative models or approaches if the user wants to improve performance further.
"""
        
        response = llm.invoke(prompt)
        recommendation_text = response.content
        
        artifacts_dir = _get_artifacts_dir(session_id)
        os.makedirs(artifacts_dir, exist_ok=True)
        rec_path = os.path.join(artifacts_dir, "recommendation.md")
        
        with open(rec_path, "w") as f:
            f.write(recommendation_text)
            
        publish_log(session_id, "Recommendation report generated.")
        return {"recommendation_path": rec_path}
        
    except Exception as e:
        publish_log(session_id, f"Recommendation Node Error: {e}")
        return {"error": str(e)}
