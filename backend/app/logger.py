import logging
import json
from datetime import datetime
from backend.app.config import LOG_LEVEL

class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if hasattr(record, "task_id"):
            log_record["task_id"] = record.task_id
        if hasattr(record, "phase"):
            log_record["phase"] = record.phase
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_record)

def get_logger(name: str):
    logger = logging.getLogger(name)
    
    if not logger.handlers:
        logger.setLevel(LOG_LEVEL)
        
        console_handler = logging.StreamHandler()
        console_handler.setLevel(LOG_LEVEL)
        
        formatter = JsonFormatter()
        console_handler.setFormatter(formatter)
        
        logger.addHandler(console_handler)
        
        # Prevent double logging
        logger.propagate = False

    return logger
