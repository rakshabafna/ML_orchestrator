import os
import logging
import json
from faker import Faker
from crewai.tools import tool

logger = logging.getLogger(__name__)
fake = Faker()

@tool("Search Data Tool")
def search_data(query: str) -> str:
    """
    Search tool for data queries.
    Use this to find relevant datasets, repositories, or technical documentation.
    Returns JSON string with search results containing titles, urls, and snippets.
    """
    api_key = os.getenv("SEARCH_API_KEY")
    
    if api_key:
        logger.info(f"Using Tavily Search API for query: {query}")
        import requests
        try:
            response = requests.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": api_key,
                    "query": query,
                    "search_depth": "basic",
                    "max_results": 5
                },
                timeout=15
            )
            response.raise_for_status()
            data = response.json()
            parsed_results = []
            for item in data.get("results", []):
                parsed_results.append({
                    "title": item.get("title"),
                    "url": item.get("url"),
                    "snippet": item.get("content")
                })
            return json.dumps(parsed_results, indent=2)
        except Exception as e:
            logger.error(f"Tavily API search failed: {e}. Falling back to simulated data.")
    else:
        logger.info(f"Using simulated search results for query: {query}")
        results = []
        for i in range(3):
            topic = query.replace(" ", "-").lower()
            results.append({
                "title": f"{topic.capitalize()} Dataset {i+1} by {fake.company()}",
                "url": f"https://github.com/mock-repo/{topic}-dataset-{i+1}",
                "snippet": fake.sentence(nb_words=15)
            })
        
        return json.dumps(results, indent=2)
