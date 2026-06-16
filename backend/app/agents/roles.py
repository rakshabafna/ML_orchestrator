import os
import re
from crewai import Agent, LLM
from backend.app.agents.config import AGENT_MODELS, EXTRA_HEADERS, OPENROUTER_API_KEY
from backend.app.tools.search_tool import search_data
from backend.app.tools.exec_tool import execute_python_code
from backend.app.agents.streaming import TokenStreamingCallback

class StripThinkLLM(LLM):
    """
    A wrapper around CrewAI's standard LLM that actively strips out DeepSeek's
    internal <think>...</think> reasoning tags from the raw output.
    """
    def call(self, *args, **kwargs) -> str:
        response = super().call(*args, **kwargs)
        if isinstance(response, str):
            clean_text = re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL).strip()
            clean_text = re.sub(r'<think>.*', '', clean_text, flags=re.DOTALL).strip()
            return clean_text
        return response

def get_llm(role_name: str, session_id: str):
    model_name = AGENT_MODELS.get(role_name, AGENT_MODELS["fallback"])
    
    llm_kwargs = {
        "model": f"openrouter/{model_name}",
        "api_key": OPENROUTER_API_KEY,
        "base_url": "https://api.openrouter.ai/api/v1",
        "extra_headers": EXTRA_HEADERS,
        "max_tokens": 8000,
        "callbacks": [TokenStreamingCallback(session_id)]
    }
    
    if "deepseek" in model_name.lower():
        return StripThinkLLM(**llm_kwargs)
    return LLM(**llm_kwargs)

DATA_ROOT = os.getenv("DATA_ROOT", "/data")

def get_raw_data_dir(session_id: str):
    return f"{DATA_ROOT}/{session_id}/raw"

def get_clean_data_dir(session_id: str):
    return f"{DATA_ROOT}/{session_id}/clean"

def get_artifacts_dir(session_id: str):
    return f"{DATA_ROOT}/{session_id}/artifacts"

def create_agents(session_id: str):
    sourcing_agent = Agent(
        role="Sourcing Agent",
        goal="Find and download datasets, or generate synthetic datasets if real ones are unavailable.",
        backstory="An expert data sourcer. You use the search_data tool to find dataset links. If you cannot download real data, you write a Python script using Faker to generate synthetic data with localized names and use the execute_python_code tool to run it. The data must be saved as a CSV to the exact path specified by the user.",
        llm=get_llm("sourcing", session_id),
        tools=[search_data, execute_python_code],
        allow_delegation=False,
        verbose=True
    )

    engineer_agent = Agent(
        role="Data Engineer Agent",
        goal="Read raw data, clean it, handle missing values and encoding, and output processed data.",
        backstory="A meticulous data engineer. You write Python code using pandas to read files, handle missing values, fix encodings, and write the cleaned dataset. You use execute_python_code to run your pandas scripts.",
        llm=get_llm("engineer", session_id),
        tools=[execute_python_code],
        allow_delegation=False,
        verbose=True
    )

    selector_agent = Agent(
        role="Model Selection Agent",
        goal="Evaluate multiple machine learning models and rank them based on performance.",
        backstory="A machine learning researcher. You write Python code to read cleaned data, split it 80/20, and evaluate Logistic Regression, Random Forest, and XGBoost using scikit-learn. You then output a leaderboard JSON ranking the models based on accuracy/F1. You run your code via execute_python_code.",
        llm=get_llm("selector", session_id),
        tools=[execute_python_code],
        allow_delegation=False,
        verbose=True
    )

    tuner_agent = Agent(
        role="Tuning Agent",
        goal="Optimize the best model's hyperparameters and save the final serialized model.",
        backstory="An expert ML tuning engineer. You parse the leaderboard from the Model Selection Agent, identify the best model, write Python code to run a fast GridSearchCV for hyperparameter tuning, and serialize the final best weights to the requested location using joblib. You use execute_python_code to run your optimizations.",
        llm=get_llm("tuner", session_id),
        tools=[execute_python_code],
        allow_delegation=False,
        verbose=True
    )
    
    return sourcing_agent, engineer_agent, selector_agent, tuner_agent
