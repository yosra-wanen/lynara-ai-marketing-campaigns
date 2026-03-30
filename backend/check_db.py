from supabase import create_client
import sys

URL = 'https://jwkjqowuponrqmxwhgsj.supabase.co'
SVC = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2pxb3d1cG9ucnFteHdoZ3NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzExNCwiZXhwIjoyMDg2NzUzMTE0fQ.cZPC5QXFMOyWBJgDBKc9uXoo-a6x0E-vbaH3AqHwsIc'
sb = create_client(URL, SVC)

def check_counts():
    print("Checking counts in catalog.items by company_id:")
    res = sb.postgrest.schema('catalog').from_('items').select('company_id').execute()
    counts = {}
    for item in res.data:
        cid = item.get('company_id')
        counts[cid] = counts.get(cid, 0) + 1
    
    for cid, count in counts.items():
        print(f"Company ID: {cid} -> {count} items")

    print("\nChecking counts in catalog.media_assets by company_id:")
    res = sb.postgrest.schema('catalog').from_('media_assets').select('company_id').execute()
    mcounts = {}
    for item in res.data:
        cid = item.get('company_id')
        mcounts[cid] = mcounts.get(cid, 0) + 1
    
    for cid, count in mcounts.items():
        print(f"Company ID: {cid} -> {count} media assets")

if __name__ == "__main__":
    check_counts()
