from supabase import create_client
import sys

URL = 'https://jwkjqowuponrqmxwhgsj.supabase.co'
SVC = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2pxb3d1cG9ucnFteHdoZ3NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzExNCwiZXhwIjoyMDg2NzUzMTE0fQ.cZPC5QXFMOyWBJgDBKc9uXoo-a6x0E-vbaH3AqHwsIc'
sb = create_client(URL, SVC)

user_id = "ddcb905c-9cfb-458d-8b24-5af41d28462b"

def check_user_memberships():
    print(f"Checking memberships for user: {user_id}")
    res = sb.postgrest.schema('core').from_('company_members').select('*, companies:companies(*)').eq('user_id', user_id).execute()
    for row in res.data:
        comp = row.get('companies')
        print(f"Member of: {row.get('company_id')} ({comp.get('legal_name') if comp else 'Unknown'})")

if __name__ == "__main__":
    check_user_memberships()
