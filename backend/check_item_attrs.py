from supabase import create_client
import sys

URL = 'https://jwkjqowuponrqmxwhgsj.supabase.co'
SVC = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2pxb3d1cG9ucnFteHdoZ3NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzExNCwiZXhwIjoyMDg2NzUzMTE0fQ.cZPC5QXFMOyWBJgDBKc9uXoo-a6x0E-vbaH3AqHwsIc'
sb = create_client(URL, SVC)

def check_item_attrs():
    res = sb.postgrest.schema('catalog').from_('item_attributes').select('*').limit(1).execute()
    if res.data:
        print(f"Columns in item_attributes: {list(res.data[0].keys())}")
    else:
        # Since table exists but is empty, try to insert a dummy row or just use an error message to see schema?
        # Actually, let's try to query a known non-existent column to see if we get the schema in error (won't work for postgrest usually).
        # Let's just assume it's the schema definition for item types because line 150 of catalog.py suggests it.
        print("Table item_attributes is empty.")

if __name__ == "__main__":
    check_item_attrs()
