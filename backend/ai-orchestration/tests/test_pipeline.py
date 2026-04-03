"""Tests unitaires pour l'orchestrateur et le pipeline lead_research."""
import pytest
import sys
import os
from unittest.mock import patch, AsyncMock, MagicMock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestRateLimiter:
    """Tests for rate limiter."""

    def test_rate_limiter_allows_first_call(self):
        """First call should always be allowed."""
        from app.services.rate_limiter import RateLimiter
        limiter = RateLimiter()
        assert limiter.check_serpapi("test_company") is True

    def test_rate_limiter_blocks_after_limit(self):
        """Should block after reaching the limit."""
        from app.services.rate_limiter import RateLimiter
        limiter = RateLimiter()
        # Exhaust the limit
        for _ in range(10):
            limiter.is_allowed("serpapi", "test_company", 10)
        # Next call should be blocked
        assert limiter.is_allowed("serpapi", "test_company", 10) is False

    def test_rate_limiter_different_companies_independent(self):
        """Different companies should have independent rate limits."""
        from app.services.rate_limiter import RateLimiter
        limiter = RateLimiter()
        for _ in range(10):
            limiter.is_allowed("serpapi", "company_a", 10)
        # company_b should still be allowed
        assert limiter.is_allowed("serpapi", "company_b", 10) is True

    def test_rate_limiter_get_usage(self):
        """get_usage should return correct structure."""
        from app.services.rate_limiter import RateLimiter
        limiter = RateLimiter()
        limiter.check_serpapi("test_company")
        usage = limiter.get_usage("test_company")
        assert "serpapi" in usage
        assert "firecrawl" in usage
        assert "ai" in usage
        assert usage["serpapi"]["used"] == 1
        assert "remaining" in usage["serpapi"]


class TestMetrics:
    """Tests for metrics tracker."""

    def test_metrics_job_started(self):
        """job_started should increment total jobs."""
        from app.services.metrics import MetricsTracker
        tracker = MetricsTracker()
        tracker.job_started("test_company")
        m = tracker.get_metrics("test_company")
        assert m["total_jobs"] == 1
        assert m["active_jobs"] == 1

    def test_metrics_job_completed(self):
        """job_completed should update success count and duration."""
        from app.services.metrics import MetricsTracker
        tracker = MetricsTracker()
        tracker.job_started("test_company")
        tracker.job_completed("test_company", 2.5)
        m = tracker.get_metrics("test_company")
        assert m["successful_jobs"] == 1
        assert m["active_jobs"] == 0
        assert m["avg_duration_seconds"] == 2.5

    def test_metrics_job_failed(self):
        """job_failed should update error count."""
        from app.services.metrics import MetricsTracker
        tracker = MetricsTracker()
        tracker.job_started("test_company")
        tracker.job_failed("test_company", 1.0, "Test error")
        m = tracker.get_metrics("test_company")
        assert m["failed_jobs"] == 1
        assert m["active_jobs"] == 0

    def test_metrics_error_rate(self):
        """error_rate should be calculated correctly."""
        from app.services.metrics import MetricsTracker
        tracker = MetricsTracker()
        tracker.job_started("test_company")
        tracker.job_completed("test_company", 1.0)
        tracker.job_started("test_company")
        tracker.job_failed("test_company", 1.0, "error")
        m = tracker.get_metrics("test_company")
        assert m["error_rate_percent"] == 50.0

    def test_metrics_multiple_companies(self):
        """Metrics should be independent per company."""
        from app.services.metrics import MetricsTracker
        tracker = MetricsTracker()
        tracker.job_started("company_a")
        tracker.job_completed("company_a", 1.0)
        m_b = tracker.get_metrics("company_b")
        assert m_b["total_jobs"] == 0


class TestBuildSearchQueries:
    """Tests for _build_search_queries function."""

    def test_basic_query_with_location(self):
        """Should include location in first query."""
        from app.api.lead_research import _build_search_queries, LeadResearchRequest
        req = LeadResearchRequest(keywords="directeur", location="Tunis")
        queries = _build_search_queries(req)
        assert any("Tunis" in q for q in queries)
        assert any("directeur" in q for q in queries)

    def test_max_3_queries(self):
        """Should return at most 3 queries."""
        from app.api.lead_research import _build_search_queries, LeadResearchRequest
        req = LeadResearchRequest(
            keywords="directeur",
            location="Tunis",
            industry="Immobilier",
            target_persona="CEO"
        )
        queries = _build_search_queries(req)
        assert len(queries) <= 3

    def test_query_without_location(self):
        """Should still return queries without location."""
        from app.api.lead_research import _build_search_queries, LeadResearchRequest
        req = LeadResearchRequest(keywords="directeur commercial")
        queries = _build_search_queries(req)
        assert len(queries) >= 1
        assert "directeur commercial" in queries[0]

    def test_industry_query_included(self):
        """Should include industry query when both industry and location provided."""
        from app.api.lead_research import _build_search_queries, LeadResearchRequest
        req = LeadResearchRequest(
            keywords="directeur",
            location="Tunis",
            industry="Immobilier"
        )
        queries = _build_search_queries(req)
        assert any("Immobilier" in q for q in queries)