from app.api.catalog import list_items_with_images
try:
    print(list_items_with_images())
except Exception as e:
    import traceback
    traceback.print_exc()
