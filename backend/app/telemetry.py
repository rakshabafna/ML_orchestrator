import json
import redis
from datetime import datetime
from backend.app.config import REDIS_URL
from backend.app.logger import get_logger

logger = get_logger(__name__)

def get_redis_client():
    return redis.from_url(REDIS_URL, decode_responses=True)

def publish_event(session_id: str, node: str, status: str, message: str):
    """Publish a structured node event."""
    try:
        client = get_redis_client()
        event = {
            "type": "node_event",
            "node": node,
            "status": status,
            "message": message,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
        client.publish(f"session_{session_id}", json.dumps(event))
        client.close()
    except Exception as e:
        logger.error(f"Failed to publish telemetry event: {e}")

def publish_phase(session_id: str, phase_name: str):
    """Publish a phase update to update the UI progress bar."""
    try:
        client = get_redis_client()
        client.publish(f"session_{session_id}", json.dumps({
            "type": "phase",
            "content": phase_name
        }))
        client.close()
    except Exception as e:
        logger.error(f"Failed to publish phase event: {e}")

def publish_log(session_id: str, message: str):
    """Publish a raw token/log to the frontend terminal."""
    try:
        client = get_redis_client()
        client.publish(f"session_{session_id}", json.dumps({
            "type": "token",
            "content": message + "\n"
        }))
        client.close()
    except Exception as e:
        logger.error(f"Failed to publish log event: {e}")
