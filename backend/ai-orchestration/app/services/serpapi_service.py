"""SerpAPI search service."""
import httpx
from app.config.settings import SERPAPI_KEY

async def search_web(query: str, location: str = "", num_results: int = 10) -> list:
    """Search the web using SerpAPI."""
    if not SERPAPI_KEY or SERPAPI_KEY in ["", "Serpai_Key"]:
        return _mock_results(query)
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            params = {
                "q": query,
                "api_key": SERPAPI_KEY,
                "num": num_results,
                "hl": "fr",
            }
            if location:
                params["location"] = location
            res = await client.get("https://serpapi.com/search", params=params)
            data = res.json()
            results = []
            for r in data.get("organic_results", []):
                results.append({
                    "title": r.get("title", ""),
                    "link": r.get("link", ""),
                    "snippet": r.get("snippet", ""),
                    "source": "serpapi"
                })
            return results
    except Exception as e:
        print(f"SerpAPI error: {e}")
        return _mock_results(query)

def _mock_results(query: str) -> list:
    return [
        {"title": f"Result for {query}", "link": "https://example.com", "snippet": f"Company related to {query}", "source": "mock"},
        {"title": f"Business {query}", "link": "https://example2.com", "snippet": f"Professional services for {query}", "source": "mock"},
    ]