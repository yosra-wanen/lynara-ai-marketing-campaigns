"""Rate limiter for external API calls."""
import time
from collections import defaultdict
from threading import Lock
from app.config.settings import (
    SERPAPI_RATE_LIMIT,
    FIRECRAWL_RATE_LIMIT,
    EXA_RATE_LIMIT,
    AI_RATE_LIMIT
)

class RateLimiter:
    """Simple in-memory rate limiter per company per service."""

    def __init__(self):
        self._calls = defaultdict(list)
        self._lock = Lock()

    def _clean_old_calls(self, key: str, window: int = 60):
        """Remove calls older than the time window (in seconds)."""
        now = time.time()
        self._calls[key] = [t for t in self._calls[key] if now - t < window]

    def is_allowed(self, service: str, company_id: str, limit: int) -> bool:
        """Check if a call is allowed based on rate limit."""
        key = f"{service}:{company_id}"
        with self._lock:
            self._clean_old_calls(key)
            if len(self._calls[key]) >= limit:
                return False
            self._calls[key].append(time.time())
            return True

    def check_serpapi(self, company_id: str) -> bool:
        return self.is_allowed("serpapi", company_id, SERPAPI_RATE_LIMIT)

    def check_firecrawl(self, company_id: str) -> bool:
        return self.is_allowed("firecrawl", company_id, FIRECRAWL_RATE_LIMIT)

    def check_exa(self, company_id: str) -> bool:
        return self.is_allowed("exa", company_id, EXA_RATE_LIMIT)

    def check_ai(self, company_id: str) -> bool:
        return self.is_allowed("ai", company_id, AI_RATE_LIMIT)

    def get_usage(self, company_id: str) -> dict:
        """Get current usage stats for a company."""
        now = time.time()
        result = {}
        for service, limit in [
            ("serpapi", SERPAPI_RATE_LIMIT),
            ("firecrawl", FIRECRAWL_RATE_LIMIT),
            ("exa", EXA_RATE_LIMIT),
            ("ai", AI_RATE_LIMIT)
        ]:
            key = f"{service}:{company_id}"
            with self._lock:
                self._clean_old_calls(key)
                used = len(self._calls[key])
            result[service] = {
                "used": used,
                "limit": limit,
                "remaining": max(0, limit - used)
            }
        return result


# Global rate limiter instance
rate_limiter = RateLimiter()