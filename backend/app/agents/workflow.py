from crewai import Task, Crew, Process
from backend.app.agents.roles import create_agents, get_raw_data_dir, get_clean_data_dir, get_artifacts_dir
from backend.app.agents.streaming import publish_phase_update
import os

def run_workflow(session_id: str, dataset_prompt: str):
    sourcing_agent, engineer_agent, selector_agent, tuner_agent = create_agents(session_id)

    raw_data_dir = get_raw_data_dir(session_id)
    clean_data_dir = get_clean_data_dir(session_id)
    artifacts_dir = get_artifacts_dir(session_id)

    os.makedirs(raw_data_dir, exist_ok=True)
    os.makedirs(clean_data_dir, exist_ok=True)
    os.makedirs(artifacts_dir, exist_ok=True)

    task1 = Task(
        description=f"Source or generate data for the following prompt: '{dataset_prompt}'.\n"
                    f"If finding a dataset fails, use Python and Faker to generate one.\n"
                    f"You MUST save the resulting dataset as a CSV file to the exact absolute path: {raw_data_dir}/dataset.csv",
        expected_output="A confirmation string indicating the dataset was saved successfully to the raw directory.",
        agent=sourcing_agent,
        task_callback=lambda x: publish_phase_update(session_id, "Cleaning")
    )

    task2 = Task(
        description=f"Read the dataset from {raw_data_dir}/dataset.csv using pandas.\n"
                    f"Clean the data: handle any missing values, encode categorical columns if necessary.\n"
                    f"You MUST save the processed file exactly to {clean_data_dir}/cleaned_dataset.csv",
        expected_output="A string confirming that the cleaned dataset was saved successfully.",
        agent=engineer_agent,
        task_callback=lambda x: publish_phase_update(session_id, "Training")
    )

    task3 = Task(
        description=f"Read the cleaned dataset from {clean_data_dir}/cleaned_dataset.csv.\n"
                    f"Split it into 80/20 train/test sets. Evaluate Logistic Regression, Random Forest, "
                    f"and XGBoost models using scikit-learn.\n"
                    f"Output a JSON containing a leaderboard ranking the models by accuracy or F1 score.\n"
                    f"Ensure your python code actually evaluates them and prints the JSON leaderboard.",
        expected_output="A JSON string representing the leaderboard of the evaluated models.",
        agent=selector_agent,
        task_callback=lambda x: publish_phase_update(session_id, "Finalizing")
    )

    task4 = Task(
        description=f"Based on the leaderboard provided by the previous task, identify the best performing model.\n"
                    f"Write a script to load {clean_data_dir}/cleaned_dataset.csv, setup the best model, "
                    f"run a GridSearchCV optimization for hyperparameters, and serialize the trained, tuned model "
                    f"to {artifacts_dir}/model.joblib using joblib.\n"
                    f"You MUST save the model to the exact absolute path.",
        expected_output="A confirmation that the final tuned model has been serialized to the artifacts directory.",
        agent=tuner_agent,
        task_callback=lambda x: publish_phase_update(session_id, "Complete")
    )

    # Initialize the first phase
    publish_phase_update(session_id, "Sourcing")

    crew = Crew(
        agents=[sourcing_agent, engineer_agent, selector_agent, tuner_agent],
        tasks=[task1, task2, task3, task4],
        process=Process.sequential,
        verbose=True
    )

    result = crew.kickoff()
    return result

if __name__ == "__main__":
    print("Starting ML Pipeline Workflow...")
    result = run_workflow("test_session_123", "Predictive maintenance dataset with 1000 rows")
    print("Pipeline Result:")
    print(result)
