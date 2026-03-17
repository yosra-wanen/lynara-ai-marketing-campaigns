from fastapi import APIRouter
from supabase import create_client
from pydantic import BaseModel

router = APIRouter(prefix="", tags=["catalog"])

SUPABASE_URL = "https://jwkjqowuponrqmxwhgsj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2pxb3d1cG9ucnFteHdoZ3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNzcxMTQsImV4cCI6MjA4Njc1MzExNH0.lkVrhdwCN321rZk_s5DtUMlrxSMf8ilAU5gPce7emBg"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


class Item(BaseModel):
    title_fr: str
    description_fr: str | None = None
    price: float | None = None
    category_id: int | None = None


@router.get("/items")
def list_items():
    response = (
        supabase.postgrest
        .schema("catalog")
        .from_("items")
        .select("*, categories(name)")
        .order("created_at", desc=True)
        .execute()
    )

    return response.data


@router.get("/items/{item_id}")
def get_item(item_id: str):
    response = (
        supabase.postgrest.schema("catalog")
        .table("items")
        .select("*")
        .eq("id", item_id)
        .single()
        .execute()
    )
    return response.data


@router.post("/items")
def create_item(item: Item):
    response = (
        supabase.postgrest
        .schema("catalog")
        .table("items")
        .insert(item.dict())
        .execute()
    )
    return response.data


@router.put("/items/{item_id}")
def update_item(item_id: str, item: Item):
    response = (
        supabase.postgrest.schema("catalog")
        .table("items")
        .update(item.dict())
        .eq("id", item_id)
        .execute()
    )
    return response.data


@router.get("/items-with-images")
def list_items_with_images():

    items = supabase.postgrest \
        .schema("catalog") \
        .from_("items") \
        .select("id,title_fr,description_fr,price,categories(name)") \
        .order("created_at", desc=True) \
        .execute().data

    media = supabase.postgrest \
        .schema("catalog") \
        .from_("media_assets") \
        .select("item_id,url") \
        .execute().data

    media_map = {}

    for m in media:
        media_map[str(m["item_id"])] = m["url"]

    result = []

    for item in items:

        image = media_map.get(str(item["id"]))

        # Gestion sécurisée du nom de catégorie (peut être un objet ou une liste selon Supabase)
        category_obj = item.get("categories")
        category_name = None
        if category_obj:
            if isinstance(category_obj, list) and len(category_obj) > 0:
                category_name = category_obj[0].get("name")
            elif isinstance(category_obj, dict):
                category_name = category_obj.get("name")

        result.append({
            "id": item["id"],
            "title_fr": item["title_fr"],
            "description_fr": item["description_fr"],
            "price": item["price"],
            "category": category_name,
            "image_url": image
        })

    return result


@router.get("/items/{item_id}/media")
def get_item_media(item_id: str):

    media = (
        supabase.postgrest.schema("catalog")
        .table("media_assets")
        .select("id,url")
        .eq("item_id", item_id)
        .execute()
    )

    return media.data


@router.get("/categories")
def get_categories():

    response = (
        supabase.postgrest.schema("catalog")
        .table("categories")
        .select("id,name")
        .execute()
    )

    return response.data
