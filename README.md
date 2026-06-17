# NeuralFlow AutoML Orchestrator

NeuralFlow is an autonomous ML Experiment Orchestrator powered by LangGraph, FastAPI, Redis, and Next.js.

## Prerequisites
- Python 3.10+
- Node.js 18+
- Redis Server (Running on `localhost:6379`)

## Environment Variables
Ensure you have a `.env` file in the `backend/` directory with your OpenRouter or LLM API keys:
```
OPENROUTER_API_KEY=your_key_here
REDIS_URL=redis://localhost:6379/0
```

## How to Run Locally

You will need 4 separate terminal windows to run the full application stack locally:

### 1. Start Redis
Make sure Redis is running. If you have Docker installed, you can easily spin one up:
```bash
docker run -p 6379:6379 -d redis
```

### 2. Start the Celery Worker (Pipeline Engine)
Open a terminal in the root project folder `ML_orchestrator`.
```bash
# Activate your python virtual environment if you have one
# Since you are on Windows, you must use `-P solo` for Celery
celery -A backend.app.celery_app worker --loglevel=info -P solo
```

### 3. Start the FastAPI Backend
Open another terminal in the root project folder `ML_orchestrator`.
```bash
uvicorn backend.app.main:app --reload --port 8000
```

### 4. Start the Next.js Frontend
Open a final terminal and navigate to the `frontend` directory.
```bash
cd frontend
npm run dev
```

Now, navigate to `http://localhost:3000` in your browser to use NeuralFlow!
