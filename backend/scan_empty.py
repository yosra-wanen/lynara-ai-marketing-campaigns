from supabase import create_client
import sys

URL = 'https://jwkjqowuponrqmxwhgsj.supabase.co'
SVC = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2pxb3d1cG9ucnFteHdoZ3NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzExNCwiZXhwIjoyMDg2NzUzMTE0fQ.cZPC5QXFMOyWBJgDBKc9uXoo-a6x0E-vbaH3AqHwsIc'
sb = create_client(URL, SVC)

# WORKAROUND: Query a non-existent column to see if Postgrest returns the available columns in the error message
def get_columns_workaround(table):
    print(f"\nScanning table: {table}")
    try:
        sb.postgrest.schema('catalog').from_(table).select('non_existent_column').execute()
    except Exception as e:
        # Some versions of postgrest return the columns here
        print(f"Error for {table}: {e}")

if __name__ == "__main__":
    get_columns_workaround('item_attributes')
    get_columns_workaround('item_attribute_values')
