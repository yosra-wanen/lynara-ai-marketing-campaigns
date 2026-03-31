from supabase import create_client
import sys

URL = 'https://jwkjqowuponrqmxwhgsj.supabase.co'
SVC = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2pxb3d1cG9ucnFteHdoZ3NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzExNCwiZXhwIjoyMDg2NzUzMTE0fQ.cZPC5QXFMOyWBJgDBKc9uXoo-a6x0E-vbaH3AqHwsIc'
sb = create_client(URL, SVC)

# To check user metadata, we need to look into auth.users, but SVC key usually has access to auth schema too link-wise?
# Actually, Postgrest usually doesn't expose auth schema directly via the sb client unless configured.
# But I can try.

def check_user_meta():
    try:
        res = sb.table('users').select('*').execute() # this usually fails
        print(res.data)
    except:
        print("Cannot access auth.users directly.")

if __name__ == "__main__":
    check_user_meta()
