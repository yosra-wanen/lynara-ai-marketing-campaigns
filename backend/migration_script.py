from supabase import create_client
import os

SUPABASE_URL = "https://jwkjqowuponrqmxwhgsj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2pxb3d1cG9ucnFteHdoZ3NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzExNCwiZXhwIjoyMDg2NzUzMTE0fQ.cZPC5QXFMOyWBJgDBKc9uXoo-a6x0E-vbaH3AqHwsIc"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

TARGET_COMPANY_ID = "fa4740c4-f331-4c4e-8798-b033e316540a"
USER_ID = "ddcb905c-9cfb-458d-8b24-5af41d28462b"
ALT_IDS = ["0259bdb9-4ed4-494c-b227-e89e4963d016", "2cb1b275-dfce-4579-8ab0-1aef70853e9c"]

def migrate():
    print(f"Adding user {USER_ID} as OWNER of company {TARGET_COMPANY_ID}...")
    supabase.postgrest.schema('core').table('company_members').upsert({
        'user_id': USER_ID,
        'company_id': TARGET_COMPANY_ID,
        'role': 'owner'
    }).execute()

    for alt in ALT_IDS:
        print(f"Moving items from {alt} to {TARGET_COMPANY_ID}...")
        supabase.postgrest.schema('catalog').table('items').update({'company_id': TARGET_COMPANY_ID}).eq('company_id', alt).execute()
        supabase.postgrest.schema('catalog').table('media_assets').update({'company_id': TARGET_COMPANY_ID}).eq('company_id', alt).execute()
        
        print(f"Deleting memberships for company {alt}...")
        supabase.postgrest.schema('core').table('company_members').delete().eq('company_id', alt).execute()
        
        print(f"Deleting company {alt}...")
        supabase.postgrest.schema('core').table('companies').delete().eq('company_id', alt).execute()

    print("Consolidation complete!")

if __name__ == "__main__":
    migrate()
