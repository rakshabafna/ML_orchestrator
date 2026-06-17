import sqlite3
import os
import json
from datetime import datetime
from backend.app.config import DB_PATH
from backend.app.logger import get_logger

logger = get_logger(__name__)

def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS experiments (
                id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                updated_at TEXT,
                status TEXT DEFAULT 'running',
                objective TEXT,
                metric TEXT,
                best_model TEXT,
                score REAL,
                task_type TEXT,
                artifact_path TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS models (
                id TEXT PRIMARY KEY,
                session_id TEXT,
                name TEXT,
                version TEXT,
                score REAL,
                metric TEXT,
                status TEXT,
                created_at TEXT
            )
        ''')
        
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Failed to init DB: {e}")

# Initialize db schema
init_db()

def create_experiment(session_id: str, objective: str, metric: str):
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat() + "Z"
    cursor.execute('''
        INSERT OR REPLACE INTO experiments (id, created_at, updated_at, status, objective, metric)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (session_id, now, now, 'running', objective, metric))
    conn.commit()
    conn.close()

def update_experiment(session_id: str, **kwargs):
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat() + "Z"
    
    set_clause = ", ".join([f"{k} = ?" for k in kwargs.keys()]) + ", updated_at = ?"
    values = list(kwargs.values()) + [now, session_id]
    
    cursor.execute(f"UPDATE experiments SET {set_clause} WHERE id = ?", values)
    conn.commit()
    conn.close()

def get_experiment(session_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM experiments WHERE id = ?", (session_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def list_experiments():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM experiments ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def delete_experiment(session_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM experiments WHERE id = ?", (session_id,))
    conn.commit()
    conn.close()

def create_model(model_id: str, session_id: str, name: str, score: float, metric: str):
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat() + "Z"
    cursor.execute('''
        INSERT INTO models (id, session_id, name, version, score, metric, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (model_id, session_id, name, "v1.0.0", score, metric, "Deployed", now))
    conn.commit()
    conn.close()

def list_models():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM models ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
