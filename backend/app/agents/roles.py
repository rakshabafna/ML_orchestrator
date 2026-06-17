import os
import re
from crewai import Agent, LLM
from crewai.llms import cache
from backend.app.agents.config import AGENT_MODELS, OPENROUTER_API_KEY
from backend.app.tools.search_tool import search_data
from backend.app.tools.exec_tool import execute_python_code
from backend.app.agents.streaming import TokenStreamingCallback

# Monkeypatch CrewAI's prompt caching to prevent invalid property errors with Groq
cache.mark_cache_breakpoint = lambda m: m

def get_llm(role_name: str, session_id: str):
    model_name = AGENT_MODELS.get(role_name, "openrouter/free")
    
    llm_kwargs = {
        "model": model_name,
        "api_key": OPENROUTER_API_KEY,
        "max_tokens": 8000,
        "callbacks": [TokenStreamingCallback(session_id)]
    }
    
    return LLM(**llm_kwargs)

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_ROOT = os.getenv("DATA_ROOT", os.path.join(PROJECT_ROOT, "backend", "data"))

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
        verbose=True,
        cache=False
    )

    engineer_agent = Agent(
        role="Data Engineer Agent",
        goal="Read raw data, clean it, handle missing values and encoding, and output processed data.",
        backstory="A meticulous data engineer. You write Python code using pandas to read files, handle missing values, fix encodings, and write the cleaned dataset. You use execute_python_code to run your pandas scripts.",
        llm=get_llm("engineer", session_id),
        tools=[execute_python_code],
        allow_delegation=False,
        verbose=True,
        cache=False
    )

    selector_agent = Agent(
        role="Model Selection Agent",
        goal="Evaluate multiple machine learning models and rank them based on performance.",
        backstory="A machine learning researcher. You write Python code to read cleaned data, split it 80/20, and evaluate Logistic Regression, Random Forest, and XGBoost using scikit-learn. You then output a leaderboard JSON ranking the models based on accuracy/F1. You run your code via execute_python_code.",
        llm=get_llm("selector", session_id),
        tools=[execute_python_code],
        allow_delegation=False,
        verbose=True,
        cache=False
    )

    tuner_agent = Agent(
        role="Tuning Agent",
        goal="Optimize the best model's hyperparameters and save the final serialized model.",
        backstory="An expert ML tuning engineer. You parse the leaderboard from the Model Selection Agent, identify the best model, write Python code to run a fast GridSearchCV for hyperparameter tuning, and serialize the final best weights to the requested location using joblib. You use execute_python_code to run your optimizations.",
        llm=get_llm("tuner", session_id),
        tools=[execute_python_code],
        allow_delegation=False,
        verbose=True,
        cache=False
    )
    
    return sourcing_agent, engineer_agent, selector_agent, tuner_agent
