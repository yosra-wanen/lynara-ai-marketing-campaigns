from supabase import create_client, Client
from dotenv import load_dotenv
import os

load_dotenv()

# Strip quotes in case .env has KEY='value' and the loader includes them
SUPABASE_URL = (os.getenv("SUPABASE_URL") or "").strip().strip("'\"")
SUPABASE_SERVICE_KEY = (os.getenv("SUPABASE_SERVICE_KEY") or "").strip().strip("'\"")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError(
        "Missing Supabase config in api-gateway. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in backend/api-gateway/.env "
        "(use Project URL and service_role key from Supabase Dashboard → Project Settings → API)."
    )
if not SUPABASE_URL.startswith("https://"):
    raise RuntimeError(
        "SUPABASE_URL must be your project URL, e.g. https://YOUR_PROJECT_REF.supabase.co"
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)