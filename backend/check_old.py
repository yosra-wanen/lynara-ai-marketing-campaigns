from supabase import create_client
import sys

URL = 'https://jwkjqowuponrqmxwhgsj.supabase.co'
SVC = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2pxb3d1cG9ucnFteHdoZ3NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzExNCwiZXhwIjoyMDg2NzUzMTE0fQ.cZPC5QXFMOyWBJgDBKc9uXoo-a6x0E-vbaH3AqHwsIc'
sb = create_client(URL, SVC)

def check_old():
    old_id = 'aa587af5-83f9-4cab-b6f2-71b5a3ab3107'
    res = sb.postgrest.schema('catalog').from_('items').select('count', count='exact').eq('company_id', old_id).execute()
    print(f"Items on OLD CID ({old_id}): {res.count}")

if __name__ == "__main__":
    check_old()
