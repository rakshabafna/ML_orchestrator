import subprocess
import os
import time

def start_process_in_new_window(command, cwd=None, title=""):
    """
    Starts a command in a new command prompt window.
    Only works on Windows.
    """
    full_command = f'start "{title}" cmd /k "{command}"'
    subprocess.Popen(full_command, shell=True, cwd=cwd)

if __name__ == "__main__":
    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")

    print("🚀 Starting NeuralFlow Services...")
    print("Ensure Redis is already running on port 6379!")
    time.sleep(2)

    # 1. Start Celery Worker
    print("Starting Celery Worker...")
    start_process_in_new_window(
        "celery -A backend.app.celery_app worker --loglevel=info -P solo",
        cwd=root_dir,
        title="Celery Worker"
    )

    # 2. Start FastAPI Backend
    print("Starting FastAPI Backend...")
    start_process_in_new_window(
        "uvicorn backend.app.main:app --reload --port 8000",
        cwd=root_dir,
        title="FastAPI Backend"
    )

    # 3. Start Next.js Frontend
    print("Starting Next.js Frontend...")
    start_process_in_new_window(
        "npm run dev",
        cwd=frontend_dir,
        title="Next.js Frontend"
    )

    print("✅ All services have been started in new windows.")
    print("You can close this window now. The servers will keep running in their own windows.")
