from supabase import create_client
import sys

URL = 'https://jwkjqowuponrqmxwhgsj.supabase.co'
SVC = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2pxb3d1cG9ucnFteHdoZ3NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzExNCwiZXhwIjoyMDg2NzUzMTE0fQ.cZPC5QXFMOyWBJgDBKc9uXoo-a6x0E-vbaH3AqHwsIc'
sb = create_client(URL, SVC)

def check_attr_tables():
    print("Listing tables in catalog schema...")
    # There is no direct way to list tables via postgrest easily without a special RPC or querying information_schema.
    # But I can try to query likely table names.
    tables = ['item_attributes', 'attribute_keys', 'item_attribute_values', 'attribute_definitions']
    for t in tables:
        try:
            res = sb.postgrest.schema('catalog').from_(t).select('count', count='exact').limit(0).execute()
            print(f"Table '{t}': EXISTS (count support: {res.count})")
        except Exception as e:
            print(f"Table '{t}': NOT FOUND or ERROR")

if __name__ == "__main__":
    check_attr_tables()
