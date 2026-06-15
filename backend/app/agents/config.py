import os
import asyncio
import logging
from dotenv import load_dotenv
from openai import AsyncOpenAI, RateLimitError

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Fetch environment variables
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "your_openrouter_api_key_here")

# Initialize the async OpenRouter client
client = AsyncOpenAI(
    base_url="https://api.openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

# Map agent roles to specific exact free models
AGENT_MODELS = {
    "sourcing": "meta-llama/llama-3.1-70b-instruct:free",
    "engineer": "qwen/qwen-2.5-coder-32b-instruct:free",
    "selector": "deepseek/deepseek-r1:free",
    "tuner": "qwen/qwen-2.5-coder-32b-instruct:free",
    "fallback": "mistralai/mistral-7b-instruct:free"
}

# OpenRouter mandatory headers for tracking/ranking
EXTRA_HEADERS = {
    "HTTP-Referer": "http://localhost:8000",  # Your site URL
    "X-Title": "Autonomous ML Experiment Orchestrator",  # Your app name
}

async def call_agent(agent_name: str, messages: list, max_retries: int = 5) -> str:
    """
    Utility function to call an agent model via OpenRouter.
    Includes exponential backoff for HTTP 429 rate limit errors.
    """
    model = AGENT_MODELS.get(agent_name)
    if not model:
        logger.warning(f"Agent '{agent_name}' not found. Falling back to the fallback model.")
        model = AGENT_MODELS["fallback"]
        
    for attempt in range(max_retries):
        try:
            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                extra_headers=EXTRA_HEADERS
            )
            # Return the generated text
            return response.choices[0].message.content
        except RateLimitError as e:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # 1s, 2s, 4s, 8s...
                logger.warning(f"Rate limit (HTTP 429) exceeded for model {model}. Retrying in {wait_time}s... (Attempt {attempt + 1}/{max_retries})")
                await asyncio.sleep(wait_time)
            else:
                logger.error(f"Max retries reached due to rate limits for agent '{agent_name}'.")
                raise e
        except Exception as e:
            logger.error(f"An unexpected error occurred while calling agent '{agent_name}': {e}")
            raise e
