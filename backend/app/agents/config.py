import os
import logging
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env')
load_dotenv(env_path)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Fetch environment variables
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

# Map agent roles to specific OpenRouter models
AGENT_MODELS = {
    "sourcing": "openrouter/nvidia/nemotron-3-ultra-550b-a55b:free",
    "engineer": "openrouter/poolside/laguna-m.1:free",
    "selector": "openrouter/nex-agi/nex-n2-pro:free",
    "tuner": "openrouter/openai/gpt-oss-120b:free",
}
