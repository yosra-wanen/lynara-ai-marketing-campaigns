import os
from supabase import create_client

SUPABASE_URL = "https://jwkjqowuponrqmxwhgsj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2pxb3d1cG9ucnFteHdoZ3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNzcxMTQsImV4cCI6MjA4Njc1MzExNH0.lkVrhdwCN321rZk_s5DtUMlrxSMf8ilAU5gPce7emBg"
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("Checking item types:")
try:
    res = supabase.postgrest.schema("catalog").from_("item_types").select("*").execute()
    print("item_types exist:", res.data)
except Exception as e:
    print("item_types error:", e)

try:
    res = supabase.postgrest.schema("catalog").from_("items").select("*").limit(1).execute()
    print("items columns exist:", res.data)
except Exception as e:
    print("items error:", e)

try:
    res = supabase.postgrest.schema("catalog").from_("item_attributes").select("*").limit(1).execute()
    print("item_attributes exist:", res.data)
except Exception as e:
    print("item_attributes error:", e)
