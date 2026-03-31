from supabase import create_client
import os
import postgrest

url = 'https://jwkjqowuponrqmxwhgsj.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2pxb3d1cG9ucnFteHdoZ3NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzExNCwiZXhwIjoyMDg2NzUzMTE0fQ.cZPC5QXFMOyWBJgDBKc9uXoo-a6x0E-vbaH3AqHwsIc'
supabase = create_client(url, key)

tables = [
    ('catalog', 'saved_views'),
    ('catalog', 'attribute_definitions'),
    ('catalog', 'item_attribute_values'),
    ('catalog', 'item_attributes'),
    ('catalog', 'favorites'),
    ('catalog', 'items'),
    ('catalog', 'categories'),
    ('catalog', 'item_variants'),
    ('catalog', 'item_options')
]

for schema, table in tables:
    try:
        supabase.postgrest.schema(schema).table(table).select('count', count='exact').limit(0).execute()
        print(f"Table '{schema}.{table}': OK")
    except Exception as e:
        print(f"Table '{schema}.{table}': FAILED - {e}")
