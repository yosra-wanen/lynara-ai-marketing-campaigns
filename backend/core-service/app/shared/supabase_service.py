import os
from fastapi import HTTPException
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()


def get_supabase():
    """Creates and returns a Supabase client with the key service_role."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise HTTPException(
            status_code=500,
            detail="Missing Supabase configuration (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)"
        )
    return create_client(url, key)
