from supabase import create_client
import sys

URL = 'https://jwkjqowuponrqmxwhgsj.supabase.co'
SVC = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2pxb3d1cG9ucnFteHdoZ3NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzExNCwiZXhwIjoyMDg2NzUzMTE0fQ.cZPC5QXFMOyWBJgDBKc9uXoo-a6x0E-vbaH3AqHwsIc'
sb = create_client(URL, SVC)

id_to_check = "0259bdb9-4ed4-494c-b227-e89e4963d016"

def check_specific():
    print(f"Checking for ID: {id_to_check}")
    res = sb.postgrest.schema('core').from_('companies').select('*').eq('company_id', id_to_check).execute()
    print(f"Company data: {res.data}")
    
    res_m = sb.postgrest.schema('core').from_('company_members').select('*').eq('company_id', id_to_check).execute()
    print(f"Members data: {res_m.data}")

if __name__ == "__main__":
    check_specific()
