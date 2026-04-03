"""Tests unitaires pour le service Firecrawl (avec mocks)."""
import pytest
import sys
import os
from unittest.mock import patch, AsyncMock, MagicMock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestFirecrawlService:
    """Tests for Firecrawl service."""

    @pytest.mark.asyncio
    async def test_crawl_page_returns_mock_when_no_key(self):
        """Should return mock content when FIRECRAWL_KEY is empty."""
        with patch("app.config.settings.FIRECRAWL_KEY", ""):
            from app.services.firecrawl_service import crawl_page
            result = await crawl_page("https://example.com")
            assert isinstance(result, str)
            assert len(result) > 0

    @pytest.mark.asyncio
    async def test_crawl_page_handles_error(self):
        """Should return fallback string on error."""
        with patch("app.config.settings.FIRECRAWL_KEY", "fake_key"):
            with patch("httpx.AsyncClient.post", side_effect=Exception("Connection error")):
                from app.services.firecrawl_service import crawl_page
                result = await crawl_page("https://example.com")
                assert isinstance(result, str)

    @pytest.mark.asyncio
    async def test_crawl_page_returns_string(self):
        """Should always return a string."""
        with patch("app.config.settings.FIRECRAWL_KEY", ""):
            from app.services.firecrawl_service import crawl_page
            result = await crawl_page("https://example.com")
            assert isinstance(result, str)

    @pytest.mark.asyncio
    async def test_crawl_page_with_invalid_url(self):
        """Should handle invalid URLs gracefully."""
        with patch("app.config.settings.FIRECRAWL_KEY", ""):
            from app.services.firecrawl_service import crawl_page
            result = await crawl_page("not-a-url")
            assert isinstance(result, str)