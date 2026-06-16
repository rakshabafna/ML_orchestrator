import os
import json
import redis

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

class TokenStreamingCallback:
    """
    Custom callback handler to stream LLM tokens to Redis Pub/Sub.
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

import sys
import io

class StreamToRedis(io.StringIO):
    """Intercepts stdout and streams it to Redis for the frontend terminal."""
    def __init__(self, session_id: str):
        super().__init__()
        self.session_id = session_id
        self.redis_client = redis.from_url(REDIS_URL)
        self.channel = f"session_{session_id}"
        self.original_stdout = sys.stdout

    def write(self, text):
        # Still print to the actual terminal
        self.original_stdout.write(text)
        
        # Stream meaningful updates to the frontend
        if text and text.strip():
            import re
            clean_text = re.sub(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])', '', text)
            if clean_text.strip():
                payload = json.dumps({"type": "token", "content": clean_text.strip()})
                self.redis_client.publish(self.channel, payload)
            
    def flush(self):
        self.original_stdout.flush()
