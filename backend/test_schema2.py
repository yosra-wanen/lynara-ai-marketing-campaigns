import os
from supabase import create_client

SUPABASE_URL = "https://jwkjqowuponrqmxwhgsj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2pxb3d1cG9ucnFteHdoZ3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNzcxMTQsImV4cCI6MjA4Njc1MzExNH0.lkVrhdwCN321rZk_s5DtUMlrxSMf8ilAU5gPce7emBg"
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    res = supabase.postgrest.schema("catalog").from_("item_types").select("*").execute()
    print("item_types:", res.data)
except Exception as e:
    print("item_types error:", e)

    
