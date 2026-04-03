"""Tests unitaires pour le service SerpAPI (avec mocks)."""
import pytest
import sys
import os
from unittest.mock import AsyncMock, patch, MagicMock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestSerpAPIService:
    """Tests for SerpAPI service."""

    @pytest.mark.asyncio
    async def test_search_web_returns_mock_when_no_key(self):
        """Should return mock results when SERPAPI_KEY is empty."""
        with patch("app.config.settings.SERPAPI_KEY", ""):
            from app.services.serpapi_service import search_web
            results = await search_web("test query")
            assert isinstance(results, list)
            assert len(results) > 0

    @pytest.mark.asyncio
    async def test_search_web_mock_result_structure(self):
        """Mock results should have required fields."""
        with patch("app.config.settings.SERPAPI_KEY", ""):
            from app.services import serpapi_service
            results = serpapi_service._mock_results("test")
            assert isinstance(results, list)
            for r in results:
                assert "title" in r
                assert "link" in r
                assert "snippet" in r
                assert "source" in r

    @pytest.mark.asyncio
    async def test_search_web_handles_api_error(self):
        """Should fall back to mock results on API error."""
        with patch("app.config.settings.SERPAPI_KEY", "fake_key"):
            with patch("httpx.AsyncClient.get", side_effect=Exception("Connection error")):
                from app.services.serpapi_service import search_web
                results = await search_web("test query")
                assert isinstance(results, list)

    @pytest.mark.asyncio
    async def test_search_web_with_location(self):
        """Should handle location parameter."""
        with patch("app.config.settings.SERPAPI_KEY", ""):
            from app.services.serpapi_service import search_web
            results = await search_web("directeur", location="Tunis")
            assert isinstance(results, list)

    @pytest.mark.asyncio
    async def test_search_web_returns_list(self):
        """Should always return a list."""
        with patch("app.config.settings.SERPAPI_KEY", ""):
            from app.services.serpapi_service import search_web
            results = await search_web("")
            assert isinstance(results, list)