import sys
sys.stdout.reconfigure(encoding='utf-8')
from supabase import create_client

URL = 'https://jwkjqowuponrqmxwhgsj.supabase.co'
SVC = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2pxb3d1cG9ucnFteHdoZ3NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzExNCwiZXhwIjoyMDg2NzUzMTE0fQ.cZPC5QXFMOyWBJgDBKc9uXoo-a6x0E-vbaH3AqHwsIc'
sb = create_client(URL, SVC)

OLD_CID = 'aa587af5-83f9-4cab-b6f2-71b5a3ab3107' # sarl 
NEW_CID = 'fa4740c4-f331-4c4e-8798-b033e316540a' # Navinspire IA

print(f'Migrating data from {OLD_CID} to {NEW_CID}...')

# 1. Update items
res_items = sb.postgrest.schema('catalog').from_('items').update({'company_id': NEW_CID}).eq('company_id', OLD_CID).execute()
print(f'  Updated {len(res_items.data)} items.')

# 2. Update media assets
res_media = sb.postgrest.schema('catalog').from_('media_assets').update({'company_id': NEW_CID}).eq('company_id', OLD_CID).execute()
print(f'  Updated {len(res_media.data)} media records.')

# 3. Update categories if any
res_cats = sb.postgrest.schema('catalog').from_('categories').update({'company_id': NEW_CID}).eq('company_id', OLD_CID).execute()
print(f'  Updated {len(res_cats.data)} categories.')

print('Migration complete.')
