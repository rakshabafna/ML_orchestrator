import subprocess
import tempfile
import logging
from pathlib import Path
from crewai.tools import tool

logger = logging.getLogger(__name__)

@tool("Python Execution Tool")
def execute_python_code(code: str) -> str:
    """
    Executes Python code in an isolated sandbox directory and returns stdout/stderr.
    Use this to run, test, and debug Python code. If the code throws an error,
    the traceback will be returned so you can self-correct the code.
    """
    with tempfile.TemporaryDirectory() as sandbox_dir:
        sandbox_path = Path(sandbox_dir)
        script_path = sandbox_path / "agent_script.py"
        
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(code)
            
        try:
            # Executes the code inside the temporary sandbox directory
            result = subprocess.run(
                ["python", str(script_path)],
                cwd=str(sandbox_path),
                capture_output=True,
                text=True,
                timeout=30  # Safety timeout
            )
            
            output = ""
            if result.stdout:
                output += f"--- STDOUT ---\n{result.stdout}\n"
            if result.stderr:
                output += f"--- STDERR ---\n{result.stderr}\n"
                
            if result.returncode == 0:
                return f"Execution successful.\n{output}".strip()
            else:
                return f"Execution failed with code {result.returncode}.\n{output}".strip()
                
        except subprocess.TimeoutExpired:
            return "Execution Error: Script timed out after 30 seconds."
        except Exception as e:
            return f"Execution Error: {str(e)}"
