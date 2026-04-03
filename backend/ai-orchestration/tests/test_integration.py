"""Tests d'intégration pour le pipeline complet."""
import pytest
import sys
import os
import json
from unittest.mock import patch, AsyncMock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient


class TestLeadResearchIntegration:
    """Integration tests for the lead research pipeline."""

    @pytest.fixture
    def client(self):
        """Create test client."""
        from app.main import app
        return TestClient(app)

    def test_health_endpoint(self, client):
        """Health endpoint should return 200."""
        response = client.get("/health/")
        assert response.status_code == 200

    def test_post_jobs_endpoint_exists(self, client):
        """POST /ai-orchestration/jobs should exist."""
        with patch("app.api.lead_research.call_ai", new_callable=AsyncMock) as mock_ai:
            with patch("app.services.serpapi_service.search_web", new_callable=AsyncMock) as mock_serp:
                with patch("app.services.firecrawl_service.crawl_page", new_callable=AsyncMock) as mock_crawl:
                    mock_serp.return_value = [
                        {"title": "Test Company", "link": "https://test.tn", "snippet": "A test company", "source": "mock"}
                    ]
                    mock_crawl.return_value = "Test company content"
                    mock_ai.return_value = json.dumps([{
                        "customer_name": "Test User",
                        "customer_email": "test@test.tn",
                        "customer_phone": "+21699000000",
                        "company_name": "Test Corp",
                        "industry": "Tech",
                        "billing_city": "Tunis",
                        "billing_country": "Tunisie",
                        "website": "test.tn",
                        "score": 80,
                        "rating": "hot",
                        "source": "web_collection",
                        "justification": "Test lead"
                    }])

                    response = client.post(
                        "/ai-orchestration/jobs?company_id=11111111-1111-1111-1111-111111111111",
                        json={
                            "keywords": "directeur",
                            "location": "Tunis",
                            "industry": "Tech",
                            "volume": 5
                        }
                    )
                    assert response.status_code == 200
                    data = response.json()
                    assert data["success"] is True
                    assert "data" in data
                    assert isinstance(data["data"], list)

    def test_json_output_format(self, client):
        """Output leads should match expected JSON format."""
        with patch("app.api.lead_research.call_ai", new_callable=AsyncMock) as mock_ai:
            with patch("app.services.serpapi_service.search_web", new_callable=AsyncMock) as mock_serp:
                with patch("app.services.firecrawl_service.crawl_page", new_callable=AsyncMock) as mock_crawl:
                    mock_serp.return_value = []
                    mock_crawl.return_value = ""
                    mock_ai.return_value = json.dumps([{
                        "customer_name": "Ahmed Ben Ali",
                        "customer_email": "ahmed@test.tn",
                        "customer_phone": "+21699000000",
                        "company_name": "Test Corp",
                        "industry": "Tech",
                        "billing_city": "Tunis",
                        "billing_country": "Tunisie",
                        "website": "test.tn",
                        "score": 75,
                        "rating": "hot",
                        "source": "web_collection",
                        "justification": "Test"
                    }])

                    response = client.post(
                        "/ai-orchestration/jobs?company_id=11111111-1111-1111-1111-111111111111",
                        json={"keywords": "directeur", "volume": 1}
                    )

                    assert response.status_code == 200
                    data = response.json()
                    leads = data["data"]

                    # Non-regression test: verify JSON output format
                    required_fields = ["customer_name", "company_name", "score", "rating", "source"]
                    for lead in leads:
                        for field in required_fields:
                            assert field in lead, f"Missing field: {field}"
                        assert lead["rating"] in ["hot", "warm", "cold"]
                        assert 0 <= lead["score"] <= 100

    def test_quotas_endpoint(self, client):
        """GET /ai-orchestration/quotas should return quota data."""
        response = client.get(
            "/ai-orchestration/quotas?company_id=11111111-1111-1111-1111-111111111111"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "data" in data

    def test_metrics_endpoint(self, client):
        """GET /ai-orchestration/metrics should return metrics data."""
        response = client.get(
            "/ai-orchestration/metrics?company_id=11111111-1111-1111-1111-111111111111"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        assert "jobs" in data["data"]
        assert "rate_limits" in data["data"]

    def test_access_endpoint(self, client):
        """GET /ai-orchestration/access should return access status."""
        response = client.get(
            "/ai-orchestration/access?company_id=11111111-1111-1111-1111-111111111111&user_id=test-user-id"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "has_access" in data