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