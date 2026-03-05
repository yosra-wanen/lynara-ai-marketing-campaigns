from supabase import create_client, Client
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

_supabase: Client | None = None


def get_supabase() -> Client:
    """Lazy-init Supabase client so the app can start even if env is missing."""
    global _supabase
    if _supabase is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise RuntimeError(
                "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env. "
                "Copy .env.example to .env and set your Supabase credentials."
            )
        _supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _supabase