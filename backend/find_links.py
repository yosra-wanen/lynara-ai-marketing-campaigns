from supabase import create_client
import sys

URL = 'https://jwkjqowuponrqmxwhgsj.supabase.co'
SVC = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2pxb3d1cG9ucnFteHdoZ3NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzExNCwiZXhwIjoyMDg2NzUzMTE0fQ.cZPC5QXFMOyWBJgDBKc9uXoo-a6x0E-vbaH3AqHwsIc'
sb = create_client(URL, SVC)

# Test multiple possible names for link tables
def find_table(names):
    for n in names:
        try:
            sb.postgrest.schema('catalog').from_(n).select('count', count='exact').limit(0).execute()
            print(f"Table Found: {n}")
            return n
        except:
            pass
    return None

if __name__ == "__main__":
    print("Testing for Category link tables:")
    find_table(['category_items', 'item_categories', 'items_categories'])
    
    print("Testing for Collection link tables:")
    find_table(['collection_items', 'item_collections', 'items_collections'])
    
    print("Testing for Tag link tables:")
    find_table(['tag_items', 'item_tags', 'items_tags'])
