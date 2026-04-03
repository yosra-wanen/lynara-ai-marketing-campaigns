"""Common SearchProvider interface with adapters for SerpAPI, Firecrawl and Exa."""
from abc import ABC, abstractmethod
from typing import Optional
from app.config.settings import SERPAPI_KEY, FIRECRAWL_KEY, EXA_API_KEY


# ─── Abstract Interface ────────────────────────────────────────────────────────

class SearchProvider(ABC):
    """Abstract base class for all search providers."""

    @abstractmethod
    async def search(self, query: str, location: str = "", num_results: int = 10) -> list:
        """Search for results and return a list of dicts with title, link, snippet."""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Check if this provider is configured and available."""
        pass

    @abstractmethod
    def get_name(self) -> str:
        """Return the provider name."""
        pass


# ─── SerpAPI Adapter ──────────────────────────────────────────────────────────

class SerpAPIProvider(SearchProvider):
    """Adapter for SerpAPI web search."""

    def get_name(self) -> str:
        return "serpapi"

    def is_available(self) -> bool:
        return bool(SERPAPI_KEY and SERPAPI_KEY not in ["", "Serpai_Key"])

    async def search(self, query: str, location: str = "", num_results: int = 10) -> list:
        from app.services.serpapi_service import search_web
        return await search_web(query=query, location=location, num_results=num_results)


# ─── Firecrawl Adapter ────────────────────────────────────────────────────────

class FirecrawlProvider(SearchProvider):
    """Adapter for Firecrawl page content extraction."""

    def get_name(self) -> str:
        return "firecrawl"

    def is_available(self) -> bool:
        return bool(FIRECRAWL_KEY and FIRECRAWL_KEY not in ["", "fire_crawl_key"])

    async def search(self, query: str, location: str = "", num_results: int = 10) -> list:
        """Firecrawl is used for content extraction, not search — returns empty for search."""
        return []

    async def crawl(self, url: str) -> str:
        """Extract content from a URL."""
        from app.services.firecrawl_service import crawl_page
        return await crawl_page(url)


# ─── Exa Adapter ──────────────────────────────────────────────────────────────

class ExaProvider(SearchProvider):
    """Adapter for Exa semantic search."""

    def get_name(self) -> str:
        return "exa"

    def is_available(self) -> bool:
        return bool(EXA_API_KEY and EXA_API_KEY not in ["", "your_exa_api_key_here"])

    async def search(self, query: str, location: str = "", num_results: int = 10) -> list:
        """Search using Exa semantic search API."""
        if not self.is_available():
            return []
        try:
            import httpx
            async with httpx.AsyncClient(timeout=30) as client:
                res = await client.post(
                    "https://api.exa.ai/search",
                    headers={
                        "Authorization": f"Bearer {EXA_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "query": query,
                        "num_results": num_results,
                        "use_autoprompt": True,
                        "type": "neural"
                    }
                )
                data = res.json()
                results = []
                for r in data.get("results", []):
                    results.append({
                        "title": r.get("title", ""),
                        "link": r.get("url", ""),
                        "snippet": r.get("text", "")[:300],
                        "source": "exa"
                    })
                return results
        except Exception as e:
            print(f"[EXA] Search error: {e}")
            return []


# ─── Search Orchestrator with Fallback ────────────────────────────────────────

class SearchOrchestrator:
    """
    Combines multiple search providers with fallback logic.
    Priority: SerpAPI → Exa → mock
    """

    def __init__(self):
        self.providers: list[SearchProvider] = [
            SerpAPIProvider(),
            ExaProvider(),
        ]
        self.firecrawl = FirecrawlProvider()

    def get_available_providers(self) -> list:
        """Return list of available provider names."""
        return [p.get_name() for p in self.providers if p.is_available()]

    async def search(self, query: str, location: str = "", num_results: int = 10) -> list:
        """
        Search using available providers with fallback.
        Tries each provider in order until results are found.
        """
        all_results = []

        for provider in self.providers:
            if not provider.is_available():
                print(f"[SEARCH] {provider.get_name()} not available, skipping")
                continue
            try:
                results = await provider.search(query, location, num_results)
                if results:
                    print(f"[SEARCH] {provider.get_name()} returned {len(results)} results")
                    all_results.extend(results)
                    break  # use first provider that returns results
            except Exception as e:
                print(f"[SEARCH] {provider.get_name()} failed: {e}, trying next provider")
                continue

        if not all_results:
            print(f"[SEARCH] All providers failed, returning empty results")

        return all_results

    async def crawl(self, url: str) -> str:
        """Extract content from a URL using Firecrawl."""
        if self.firecrawl.is_available():
            return await self.firecrawl.crawl(url)
        return ""

    def get_status(self) -> dict:
        """Get status of all providers."""
        return {
            p.get_name(): {
                "available": p.is_available(),
                "name": p.get_name()
            }
            for p in [*self.providers, self.firecrawl]
        }


# ─── Global Instance ──────────────────────────────────────────────────────────
search_orchestrator = SearchOrchestrator()