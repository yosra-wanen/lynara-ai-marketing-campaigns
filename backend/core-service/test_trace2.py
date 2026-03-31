import traceback
from app.api.catalog import supabase

with open("trace.txt", "w") as f:
    try:
        items = supabase.postgrest.schema("catalog").from_("items").select("*").limit(2).execute().data
        f.write("Items: " + str(items))
    except Exception as e:
        traceback.print_exc(file=f)
