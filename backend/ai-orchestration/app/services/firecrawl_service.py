"""Firecrawl service for page content extraction."""
import httpx
from app.config.settings import FIRECRAWL_KEY

async def crawl_page(url: str) -> str:
    """Extract content from a webpage using Firecrawl."""
    if not FIRECRAWL_KEY or FIRECRAWL_KEY in ["", "fire_crawl_key"]:
        return f"Mock content from {url}"
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.post(
                "https://api.firecrawl.dev/v0/scrape",
                headers={"Authorization": f"Bearer {FIRECRAWL_KEY}"},
                json={"url": url, "pageOptions": {"onlyMainContent": True}}
            )
            data = res.json()
            return data.get("data", {}).get("content", "")[:2000]
    except Exception as e:
        print(f"Firecrawl error: {e}")
        return f"Could not crawl {url}"