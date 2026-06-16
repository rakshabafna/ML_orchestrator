import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Fetch environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

DEFAULT_MODEL = "gemini/gemini-3.5-flash"

# Map agent roles to specific models
AGENT_MODELS = {
    "sourcing": DEFAULT_MODEL,
    "engineer": DEFAULT_MODEL,
    "selector": DEFAULT_MODEL,
    "tuner": DEFAULT_MODEL,
}
