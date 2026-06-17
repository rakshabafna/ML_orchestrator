import os
from dotenv import load_dotenv

# Load environment variables from the backend directory .env
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(env_path)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
SEARCH_API_KEY = os.getenv("SEARCH_API_KEY", "")

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_ROOT = os.getenv("DATA_ROOT", os.path.join(PROJECT_ROOT, "backend", "data"))
DB_PATH = os.path.join(DATA_ROOT, "neuralflow.db")

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
