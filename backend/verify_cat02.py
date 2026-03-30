from supabase import create_client
import sys

URL = 'https://jwkjqowuponrqmxwhgsj.supabase.co'
SVC = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2pxb3d1cG9ucnFteHdoZ3NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzExNCwiZXhwIjoyMDg2NzUzMTE0fQ.cZPC5QXFMOyWBJgDBKc9uXoo-a6x0E-vbaH3AqHwsIc'
sb = create_client(URL, SVC)

def verify_cat02_schema():
    print("--- Verifying catalog.categories ---")
    try:
        res = sb.postgrest.schema('catalog').from_('categories').select('*').limit(1).execute()
        if res.data:
            columns = res.data[0].keys()
            print(f"Columns: {list(columns)}")
            required = ['company_id', 'name', 'parent_id']
            for r in required:
                print(f"  Field {r}: {'OK' if r in columns else 'MISSING'}")
        else:
            print("Table categories is empty.")
    except Exception as e: print(f"Error: {e}")

    print("\n--- Verifying catalog.collections ---")
    try:
        res = sb.postgrest.schema('catalog').from_('collections').select('*').limit(1).execute()
        if res.data:
            columns = res.data[0].keys()
            print(f"Columns: {list(columns)}")
            required = ['company_id', 'name']
            for r in required:
                print(f"  Field {r}: {'OK' if r in columns else 'MISSING'}")
        else:
            print("Table collections is empty.")
    except Exception as e: print(f"Error: {e}")

    print("\n--- Verifying relation tables ---")
    tables = ['item_collections', 'item_tags', 'tags']
    for t in tables:
        try:
            res = sb.postgrest.schema('catalog').from_(t).select('*').limit(1).execute()
            status = "OK" if res.data or res.data == [] else "ERROR"
            print(f"Table {t}: {status}")
            if res.data:
                print(f"  Columns: {list(res.data[0].keys())}")
        except Exception as e: print(f"Table {t}: NOT FOUND or {e}")

if __name__ == "__main__":
    verify_cat02_schema()
