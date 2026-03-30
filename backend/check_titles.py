from supabase import create_client
import sys

URL = 'https://jwkjqowuponrqmxwhgsj.supabase.co'
SVC = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2pxb3d1cG9ucnFteHdoZ3NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzExNCwiZXhwIjoyMDg2NzUzMTE0fQ.cZPC5QXFMOyWBJgDBKc9uXoo-a6x0E-vbaH3AqHwsIc'
sb = create_client(URL, SVC)

def check_titles():
    res = sb.postgrest.schema('catalog').from_('items').select('title_fr, company_id').execute()
    for row in res.data:
        print(f"Title: {row.get('title_fr')} | CID: {row.get('company_id')}")

if __name__ == "__main__":
    check_titles()
