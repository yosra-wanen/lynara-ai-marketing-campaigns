from fastapi import APIRouter, HTTPException
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.shared.supabase_service import get_supabase

router = APIRouter(prefix="", tags=["catalog"])

supabase = get_supabase()


# ─────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────

class Item(BaseModel):
    title_fr: str
    description_fr: str | None = None
    price: float | None = None
    category_id: int | None = None

class VariantCreate(BaseModel):
    name: str
    price: float | None = None

class VariantUpdate(BaseModel):
    name: str | None = None
    price: float | None = None

class OptionCreate(BaseModel):
    name: str
    price: float | None = None

class OptionUpdate(BaseModel):
    name: str | None = None
    price: float | None = None

class TargetProfileCreate(BaseModel):
    name: str
    description: str | None = None

class ConditionsVente(BaseModel):
    conditions_vente: str | None = None
    acompte_percent: float | None = None
    delai_livraison: str | None = None
    politique_annulation: str | None = None


# ─────────────────────────────────────────────
# ITEMS
# ─────────────────────────────────────────────

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
        result.append({
            "id":             item["id"],
            "title_fr":       item["title_fr"],
            "description_fr": item["description_fr"],
            "price":          item["price"],
            "category":       item["categories"]["name"] if item.get("categories") else None,
            "image_url":      image
        })
    return result


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


# ─────────────────────────────────────────────
# MEDIA
# ─────────────────────────────────────────────

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


# ─────────────────────────────────────────────
# CATEGORIES
# ─────────────────────────────────────────────

@router.get("/categories")
def get_categories():
    response = (
        supabase.postgrest.schema("catalog")
        .table("categories")
        .select("id,name")
        .execute()
    )
    return response.data


# ─────────────────────────────────────────────
# VARIANTS
# ─────────────────────────────────────────────

@router.get("/items/{item_id}/variants")
def list_variants(item_id: str):
    response = (
        supabase.postgrest.schema("catalog")
        .table("item_variants")
        .select("*")
        .eq("item_id", item_id)
        .order("created_at", desc=False)
        .execute()
    )
    return response.data


@router.post("/items/{item_id}/variants")
def create_variant(item_id: str, variant: VariantCreate):
    item = (
        supabase.postgrest.schema("catalog")
        .table("items")
        .select("id, company_id")
        .eq("id", item_id)
        .maybe_single()
        .execute()
    )
    if not item.data:
        raise HTTPException(status_code=404, detail="Item introuvable")

    payload = {
        "item_id":    item_id,
        "company_id": item.data["company_id"],
        "name":       variant.name,
        "price":      variant.price,
    }
    response = (
        supabase.postgrest.schema("catalog")
        .table("item_variants")
        .insert(payload)
        .execute()
    )
    return response.data[0]


@router.put("/variants/{variant_id}")
def update_variant(variant_id: str, variant: VariantUpdate):
    payload = {k: v for k, v in variant.dict().items() if v is not None}
    if not payload:
        raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour")
    response = (
        supabase.postgrest.schema("catalog")
        .table("item_variants")
        .update(payload)
        .eq("id", variant_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Variante introuvable")
    return response.data[0]


@router.delete("/variants/{variant_id}")
def delete_variant(variant_id: str):
    response = (
        supabase.postgrest.schema("catalog")
        .table("item_variants")
        .delete()
        .eq("id", variant_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Variante introuvable")
    return {"deleted": True}


# ─────────────────────────────────────────────
# OPTIONS
# ─────────────────────────────────────────────

@router.get("/items/{item_id}/options")
def list_options(item_id: str):
    response = (
        supabase.postgrest.schema("catalog")
        .table("item_options")
        .select("*")
        .eq("item_id", item_id)
        .order("created_at", desc=False)
        .execute()
    )
    return response.data


@router.post("/items/{item_id}/options")
def create_option(item_id: str, option: OptionCreate):
    item = (
        supabase.postgrest.schema("catalog")
        .table("items")
        .select("id, company_id")
        .eq("id", item_id)
        .maybe_single()
        .execute()
    )
    if not item.data:
        raise HTTPException(status_code=404, detail="Item introuvable")

    payload = {
        "item_id":    item_id,
        "company_id": item.data["company_id"],
        "name":       option.name,
        "price":      option.price,
    }
    response = (
        supabase.postgrest.schema("catalog")
        .table("item_options")
        .insert(payload)
        .execute()
    )
    return response.data[0]


@router.put("/options/{option_id}")
def update_option(option_id: str, option: OptionUpdate):
    payload = {k: v for k, v in option.dict().items() if v is not None}
    if not payload:
        raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour")
    response = (
        supabase.postgrest.schema("catalog")
        .table("item_options")
        .update(payload)
        .eq("id", option_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Option introuvable")
    return response.data[0]


@router.delete("/options/{option_id}")
def delete_option(option_id: str):
    response = (
        supabase.postgrest.schema("catalog")
        .table("item_options")
        .delete()
        .eq("id", option_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Option introuvable")
    return {"deleted": True}


# ─────────────────────────────────────────────
# TARGET PROFILES
# ─────────────────────────────────────────────

@router.get("/target-profiles")
def list_target_profiles(company_id: str):
    response = (
        supabase.postgrest.schema("catalog")
        .table("target_profiles")
        .select("*")
        .eq("company_id", company_id)
        .order("created_at", desc=False)
        .execute()
    )
    return response.data


@router.post("/target-profiles")
def create_target_profile(profile: TargetProfileCreate, company_id: str):
    payload = {
        "company_id":  company_id,
        "name":        profile.name,
        "description": profile.description,
    }
    response = (
        supabase.postgrest.schema("catalog")
        .table("target_profiles")
        .insert(payload)
        .execute()
    )
    return response.data[0]


@router.delete("/target-profiles/{profile_id}")
def delete_target_profile(profile_id: str):
    response = (
        supabase.postgrest.schema("catalog")
        .table("target_profiles")
        .delete()
        .eq("id", profile_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Profil introuvable")
    return {"deleted": True}


@router.get("/items/{item_id}/target-profiles")
def get_item_target_profiles(item_id: str):
    response = (
        supabase.postgrest.schema("catalog")
        .table("item_target_profiles")
        .select("*, target_profiles(id, name, description)")
        .eq("item_id", item_id)
        .execute()
    )
    return response.data


@router.post("/items/{item_id}/target-profiles/{profile_id}")
def link_profile_to_item(item_id: str, profile_id: str):
    item = (
        supabase.postgrest.schema("catalog")
        .table("items")
        .select("id, company_id")
        .eq("id", item_id)
        .maybe_single()
        .execute()
    )
    if not item.data:
        raise HTTPException(status_code=404, detail="Item introuvable")

    payload = {
        "item_id":           item_id,
        "target_profile_id": profile_id,
        "company_id":        item.data["company_id"],
    }
    response = (
        supabase.postgrest.schema("catalog")
        .table("item_target_profiles")
        .insert(payload)
        .execute()
    )
    return response.data[0]


@router.delete("/items/{item_id}/target-profiles/{profile_id}")
def unlink_profile_from_item(item_id: str, profile_id: str):
    response = (
        supabase.postgrest.schema("catalog")
        .table("item_target_profiles")
        .delete()
        .eq("item_id", item_id)
        .eq("target_profile_id", profile_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Lien introuvable")
    return {"deleted": True}


# ─────────────────────────────────────────────
# CONDITIONS DE VENTE
# ─────────────────────────────────────────────

@router.get("/items/{item_id}/conditions")
def get_conditions(item_id: str):
    response = (
        supabase.postgrest.schema("catalog")
        .table("items")
        .select("conditions_vente, acompte_percent, delai_livraison, politique_annulation")
        .eq("id", item_id)
        .single()
        .execute()
    )
    return response.data


@router.put("/items/{item_id}/conditions")
def update_conditions(item_id: str, body: ConditionsVente):
    payload = {k: v for k, v in body.dict().items() if v is not None}
    if not payload:
        raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour")
    response = (
        supabase.postgrest.schema("catalog")
        .table("items")
        .update(payload)
        .eq("id", item_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Item introuvable")
    return response.data[0]
# ─────────────────────────────────────────────
# POSITIONNEMENT, TON & MOTS-CLÉS (CAT-06)
# ─────────────────────────────────────────────

class PositionnementUpdate(BaseModel):
    positioning: str | None = None
    tone: str | None = None
    keywords: list[str] | None = None
    city: str | None = None
    neighborhood: str | None = None
    nearby_poi: str | None = None


@router.get("/items/{item_id}/positionnement")
def get_positionnement(item_id: str):
    response = (
        supabase.postgrest.schema("catalog")
        .table("items")
        .select("positioning, tone, keywords, city, neighborhood, nearby_poi")
        .eq("id", item_id)
        .single()
        .execute()
    )
    return response.data


@router.put("/items/{item_id}/positionnement")
def update_positionnement(item_id: str, body: PositionnementUpdate):
    payload = {k: v for k, v in body.dict().items() if v is not None}
    if not payload:
        raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour")
    response = (
        supabase.postgrest.schema("catalog")
        .table("items")
        .update(payload)
        .eq("id", item_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Item introuvable")
    return response.data[0]