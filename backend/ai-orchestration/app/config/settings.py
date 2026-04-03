"""Configuration settings for AI Orchestration service."""

from dotenv import load_dotenv
import os

load_dotenv()

# AI Provider
AI_PROVIDER = os.getenv("AI_PROVIDER", "openrouter")
AI_MODEL = os.getenv("AI_MODEL", "mistralai/mistral-7b-instruct")
AI_API_KEY = os.getenv("AI_API_KEY", "")
AI_BASE_URL = os.getenv("AI_BASE_URL", "https://openrouter.ai/api/v1")

# Search APIs
SERPAPI_KEY = os.getenv("SERPAPI_KEY", "")
FIRECRAWL_KEY = os.getenv("FIRECRAWL_KEY", "")
EXA_API_KEY = os.getenv("EXA_API_KEY", "")

# Supabase
SUPABASE_URL = (os.getenv("SUPABASE_URL") or "").strip().strip("'\"")
SUPABASE_SERVICE_KEY = (os.getenv("SUPABASE_SERVICE_KEY") or "").strip().strip("'\"")

# CRM Service
CRM_SERVICE_URL = os.getenv("CRM_SERVICE_URL", "http://localhost:3001")

# Limits
MAX_LEADS_PER_JOB = 50
DEFAULT_LEADS_LIMIT = 10
REQUEST_TIMEOUT = 30

# ─── Rate Limiting ─────────────────────────────────────────────────
SERPAPI_RATE_LIMIT = int(os.getenv("SERPAPI_RATE_LIMIT", "10"))
FIRECRAWL_RATE_LIMIT = int(os.getenv("FIRECRAWL_RATE_LIMIT", "5"))
EXA_RATE_LIMIT = int(os.getenv("EXA_RATE_LIMIT", "10"))
AI_RATE_LIMIT = int(os.getenv("AI_RATE_LIMIT", "20"))

# ─── Timeouts & Retries ────────────────────────────────────────────
SERPAPI_TIMEOUT = int(os.getenv("SERPAPI_TIMEOUT", "30"))
FIRECRAWL_TIMEOUT = int(os.getenv("FIRECRAWL_TIMEOUT", "30"))
AI_TIMEOUT = int(os.getenv("AI_TIMEOUT", "60"))
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))

# ─── Observability ─────────────────────────────────────────────────
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
ENABLE_METRICS = os.getenv("ENABLE_METRICS", "true").lower() == "true"

# ─── Masked keys for logging ──────────────────────────────────────────────────
def mask_key(key: str) -> str:
    """Mask sensitive API keys for logging."""
    if not key or len(key) < 8:
        return "***"
    return f"{key[:4]}...{key[-4:]}"

MASKED_KEYS = {
    "AI_API_KEY": mask_key(AI_API_KEY),
    "SERPAPI_KEY": mask_key(SERPAPI_KEY),
    "FIRECRAWL_KEY": mask_key(FIRECRAWL_KEY),
    "SUPABASE_SERVICE_KEY": mask_key(SUPABASE_SERVICE_KEY),
}