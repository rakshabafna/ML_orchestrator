import subprocess
import sys
import time

def start_servers():
    print("Starting ML Orchestrator Servers...")
    print("Please ensure Redis is running on localhost:6379 before continuing.")
    
    # Start Uvicorn
    uvicorn_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
        creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == "win32" else 0
    )
    
    # Start Celery
    # On Windows, using 'solo' pool is recommended since prefork isn't fully supported.
    celery_process = subprocess.Popen(
        [sys.executable, "-m", "celery", "-A", "backend.app.celery_app", "worker", "--loglevel=info", "--pool=solo"],
        creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == "win32" else 0
    )
    
    print("\nServers started in separate console windows!")
    print(" - Uvicorn REST/WS API running on http://localhost:8000")
    print(" - Celery Worker running (ml_orchestrator)")
    print("\nTo test, you can run a script that hits POST /api/v1/orchestrate and connects to WS /api/v1/stream/{session_id}")
    
    try:
        # Keep main script alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping servers...")
        uvicorn_process.terminate()
        celery_process.terminate()

if __name__ == "__main__":
    start_servers()
