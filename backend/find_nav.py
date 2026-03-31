from supabase import create_client
import sys

URL = 'https://jwkjqowuponrqmxwhgsj.supabase.co'
SVC = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2pxb3d1cG9ucnFteHdoZ3NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzExNCwiZXhwIjoyMDg2NzUzMTE0fQ.cZPC5QXFMOyWBJgDBKc9uXoo-a6x0E-vbaH3AqHwsIc'
sb = create_client(URL, SVC)

def find_navinspire():
    print("Searching for companies with name like 'Navinspire%':")
    res = sb.postgrest.schema('core').from_('companies').select('*').ilike('legal_name', '%Navinspire%').execute()
    for row in res.data:
        print(f"ID: {row.get('company_id')} | Name: {row.get('legal_name')}")

if __name__ == "__main__":
    find_navinspire()
