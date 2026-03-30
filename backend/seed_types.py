import sys
sys.stdout.reconfigure(encoding='utf-8')
from supabase import create_client

URL = 'https://jwkjqowuponrqmxwhgsj.supabase.co'
SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2pxb3d1cG9ucnFteHdoZ3NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzExNCwiZXhwIjoyMDg2NzUzMTE0fQ.cZPC5QXFMOyWBJgDBKc9uXoo-a6x0E-vbaH3AqHwsIc'
sb = create_client(URL, SERVICE_KEY)

def get_types():
    return sb.postgrest.schema('catalog').from_('item_types').select('id, code, label').execute().data

# Canonical types we want to keep
CANONICAL = {
    'produit': 'Produit',
    'bien_immobilier': 'Bien immobilier',
    'sejour': 'Séjour / Voyage',
    'service': 'Service'
}

print('Stage 1: Ensuring canonical types exist...')
for code, label in CANONICAL.items():
    res = sb.postgrest.schema('catalog').from_('item_types').upsert({'code': code, 'label': label}, on_conflict='code').execute()
    print(f'  Upserted {code}: {label}')

# Map old types to new canonical ones
# Old code -> New code
MAPPING = {
    'immobilier': 'bien_immobilier',
    'ecommerce': 'produit',
    'serv': 'service',
}

current_data = get_types()
code_to_id = {r['code']: r['id'] for r in current_data}

print('Stage 2: Migrating items to canonical types...')
for old_code, new_code in MAPPING.items():
    if old_code in code_to_id and new_code in code_to_id:
        old_id = code_to_id[old_code]
        new_id = code_to_id[new_code]
        # Update items
        res = sb.postgrest.schema('catalog').from_('items').update({'item_type_id': new_id}).eq('item_type_id', old_id).execute()
        print(f'  Migrated items from {old_code} to {new_code} ({len(res.data)} items)')

print('Stage 3: Deleting obsolete types...')
redundant_codes = ['immobilier', 'ecommerce', 'serv', 'voyage', 'sejour_voyage']
for code in redundant_codes:
    try:
        res = sb.postgrest.schema('catalog').from_('item_types').delete().eq('code', code).execute()
        if res.data:
            print(f'  Deleted obsolete type: {code}')
    except Exception as e:
        print(f'  Could not delete {code}: {e}')

print('Final verification...')
final_types = get_types()
print('Official Generic Types:')
for t in final_types:
    print(f' - {t["code"]} -> {t["label"]}')
