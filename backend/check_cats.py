from supabase import create_client
import sys

URL = 'https://jwkjqowuponrqmxwhgsj.supabase.co'
SVC = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2pxb3d1cG9ucnFteHdoZ3NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzExNCwiZXhwIjoyMDg2NzUzMTE0fQ.cZPC5QXFMOyWBJgDBKc9uXoo-a6x0E-vbaH3AqHwsIc'
sb = create_client(URL, SVC)

def check_cats():
    res = sb.postgrest.schema('catalog').from_('categories').select('*').eq('company_id', 'fa4740c4-f331-4c4e-8798-b033e316540a').execute()
    print(f"Categories on fa47: {len(res.data)}")
    for cat in res.data:
        print(f"ID: {cat.get('id')} | Name: {cat.get('name')}")

if __name__ == "__main__":
    check_cats()
