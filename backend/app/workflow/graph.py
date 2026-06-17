import logging
from langgraph.graph import StateGraph, END
from backend.app.models import PipelineState
from backend.app.telemetry import publish_event, publish_phase

from .nodes.dataset_generation import dataset_generation_node
from .nodes.data_cleaning import data_cleaning_node
from .nodes.feature_engineering import feature_engineering_node
from .nodes.model_selection import model_selection_node
from .nodes.hyperparameter_tuning import hyperparameter_tuning_node
from .nodes.evaluation import evaluation_node
from .nodes.recommendation import recommendation_node
from .nodes.artifact_generation import artifact_generation_node

logger = logging.getLogger(__name__)

def build_graph():
    workflow = StateGraph(PipelineState)
    
    # Add Nodes
    workflow.add_node("dataset_generation", dataset_generation_node)
    workflow.add_node("data_cleaning", data_cleaning_node)
    workflow.add_node("feature_engineering", feature_engineering_node)
    workflow.add_node("model_selection", model_selection_node)
    workflow.add_node("hyperparameter_tuning", hyperparameter_tuning_node)
    workflow.add_node("evaluation", evaluation_node)
    workflow.add_node("recommendation", recommendation_node)
    workflow.add_node("artifact_generation", artifact_generation_node)
    
    # Define Edges (Sequential execution)
    workflow.set_entry_point("dataset_generation")
    
    workflow.add_edge("dataset_generation", "data_cleaning")
    workflow.add_edge("data_cleaning", "feature_engineering")
    workflow.add_edge("feature_engineering", "model_selection")
    workflow.add_edge("model_selection", "hyperparameter_tuning")
    workflow.add_edge("hyperparameter_tuning", "evaluation")
    workflow.add_edge("evaluation", "recommendation")
    workflow.add_edge("recommendation", "artifact_generation")
    workflow.add_edge("artifact_generation", END)
    
    return workflow.compile()

graph = build_graph()

def run_pipeline(session_id: str, prompt: str, target_metric: str = "accuracy"):
    initial_state = PipelineState(
        task_id=f"task_{session_id}",
        session_id=session_id,
        prompt=prompt,
        target_metric=target_metric,
        current_phase="Idle",
        logs=[],
        error=None,
        dataset_path=None,
        clean_dataset_path=None,
        feature_engineered_path=None,
        leaderboard_path=None,
        tuned_model_path=None,
        feature_report_path=None,
        tuning_report_path=None,
        explainability_path=None,
        recommendation_path=None,
        model_results=[],
        best_model_name=None,
        task_type=None,
        target_column=None
    )
    
    try:
        # Stream events from LangGraph
        for s in graph.stream(initial_state):
            for node_name, state in s.items():
                if "error" in state and state["error"]:
                    publish_event(session_id, node_name, "FAILED", state["error"])
                    publish_phase(session_id, "Failed")
                    return
                if "current_phase" in state:
                    publish_phase(session_id, state["current_phase"])
    except Exception as e:
        logger.error(f"Pipeline crashed: {e}")
        publish_event(session_id, "System", "FAILED", str(e))
        publish_phase(session_id, "Failed")
