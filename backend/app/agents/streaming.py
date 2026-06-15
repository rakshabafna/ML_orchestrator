import os
import json
import redis
from langchain_core.callbacks import BaseCallbackHandler

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

class TokenStreamingCallback(BaseCallbackHandler):
    """
    Custom LangChain callback handler to stream LLM tokens to Redis Pub/Sub.
    """
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.redis_client = redis.from_url(REDIS_URL)
        self.channel = f"session_{session_id}"

    def on_llm_new_token(self, token: str, **kwargs) -> None:
        """
        Triggered on a new LLM token. Publishes it to the Redis channel.
        """
        if token:
            payload = json.dumps({"type": "token", "content": token})
            self.redis_client.publish(self.channel, payload)

def publish_phase_update(session_id: str, phase_name: str):
    """
    Helper function to publish pipeline phase changes.
    """
    r = redis.from_url(REDIS_URL)
    payload = json.dumps({"type": "phase", "content": phase_name})
    r.publish(f"session_{session_id}", payload)
