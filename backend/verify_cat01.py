from supabase import create_client
import sys

URL = 'https://jwkjqowuponrqmxwhgsj.supabase.co'
SVC = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2pxb3d1cG9ucnFteHdoZ3NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzExNCwiZXhwIjoyMDg2NzUzMTE0fQ.cZPC5QXFMOyWBJgDBKc9uXoo-a6x0E-vbaH3AqHwsIc'
sb = create_client(URL, SVC)

def verify_schema():
    print("--- Verifying catalog.items ---")
    try:
        res = sb.postgrest.schema('catalog').from_('items').select('*').limit(1).execute()
        if res.data:
            columns = res.data[0].keys()
            print(f"Columns: {list(columns)}")
            required = ['company_id', 'created_by', 'updated_by', 'item_type_id', 'status']
            for r in required:
                print(f"  Field {r}: {'OK' if r in columns else 'MISSING'}")
        else:
            print("No data in catalog.items to check columns.")
    except Exception as e:
        print(f"Error checking items: {e}")

    print("\n--- Verifying catalog.item_types ---")
    try:
        res = sb.postgrest.schema('catalog').from_('item_types').select('*').execute()
        print(f"Found {len(res.data)} item types.")
        for row in res.data:
            print(f"  Type: {row.get('label')} (code: {row.get('code')})")
    except Exception as e:
        print(f"Error checking item_types: {e}")

    print("\n--- Verifying catalog.item_attributes ---")
    try:
        res = sb.postgrest.schema('catalog').from_('item_attributes').select('*').limit(1).execute()
        if res.data:
            columns = res.data[0].keys()
            print(f"Columns: {list(columns)}")
            required = ['company_id', 'item_id', 'key']
            for r in required:
                print(f"  Field {r}: {'OK' if r in columns else 'MISSING'}")
        else:
            print("No data in catalog.item_attributes to check columns.")
    except Exception as e:
        print(f"Error checking item_attributes: {e}")

if __name__ == "__main__":
    verify_schema()
