"""Tests unitaires pour le module config."""
import pytest
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config.settings import (
    AI_PROVIDER, AI_MODEL, AI_BASE_URL,
    MAX_LEADS_PER_JOB, DEFAULT_LEADS_LIMIT, REQUEST_TIMEOUT,
    SERPAPI_RATE_LIMIT, FIRECRAWL_RATE_LIMIT, AI_RATE_LIMIT,
    ENABLE_METRICS, mask_key, MASKED_KEYS
)


class TestConfig:
    """Tests for configuration settings."""

    def test_ai_provider_has_default(self):
        """AI_PROVIDER should have a default value."""
        assert AI_PROVIDER is not None
        assert len(AI_PROVIDER) > 0

    def test_ai_model_has_default(self):
        """AI_MODEL should have a default value."""
        assert AI_MODEL is not None
        assert len(AI_MODEL) > 0

    def test_ai_base_url_is_valid(self):
        """AI_BASE_URL should be a valid URL."""
        assert AI_BASE_URL.startswith("http")

    def test_max_leads_per_job_is_positive(self):
        """MAX_LEADS_PER_JOB should be a positive integer."""
        assert MAX_LEADS_PER_JOB > 0

    def test_default_leads_limit_is_positive(self):
        """DEFAULT_LEADS_LIMIT should be a positive integer."""
        assert DEFAULT_LEADS_LIMIT > 0

    def test_request_timeout_is_positive(self):
        """REQUEST_TIMEOUT should be positive."""
        assert REQUEST_TIMEOUT > 0

    def test_rate_limits_are_positive(self):
        """All rate limits should be positive integers."""
        assert SERPAPI_RATE_LIMIT > 0
        assert FIRECRAWL_RATE_LIMIT > 0
        assert AI_RATE_LIMIT > 0

    def test_enable_metrics_is_bool(self):
        """ENABLE_METRICS should be a boolean."""
        assert isinstance(ENABLE_METRICS, bool)

    def test_mask_key_short_key(self):
        """mask_key should return *** for short/empty keys."""
        assert mask_key("") == "***"
        assert mask_key("short") == "***"

    def test_mask_key_long_key(self):
        """mask_key should show first 4 and last 4 chars."""
        result = mask_key("sk-abcdefghij1234")
        assert result.startswith("sk-a")
        assert result.endswith("1234")
        assert "..." in result

    def test_masked_keys_structure(self):
        """MASKED_KEYS should contain all expected keys."""
        assert "AI_API_KEY" in MASKED_KEYS
        assert "SERPAPI_KEY" in MASKED_KEYS
        assert "FIRECRAWL_KEY" in MASKED_KEYS
        assert "SUPABASE_SERVICE_KEY" in MASKED_KEYS

    def test_masked_keys_no_full_exposure(self):
        """Masked keys should never be longer than 20 chars."""
        for key, value in MASKED_KEYS.items():
            assert len(value) <= 20, f"{key} is not properly masked"