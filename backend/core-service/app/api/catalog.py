from fastapi import APIRouter, HTTPException, Query
from supabase import create_client
from pydantic import BaseModel
from typing import Optional, List
import os

router = APIRouter(prefix="", tags=["catalog"])

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://jwkjqowuponrqmxwhgsj.supabase.co")
# Use service_role key so RLS doesn't silently hide reference tables (item_types, etc.)
SUPABASE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2pxb3d1cG9ucnFteHdoZ3NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzExNCwiZXhwIjoyMDg2NzUzMTE0fQ.cZPC5QXFMOyWBJgDBKc9uXoo-a6x0E-vbaH3AqHwsIc"
)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


# ─────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────

class Item(BaseModel):
    title_fr: str
    title_ar: str | None = None
    title_en: str | None = None
    subtitle_fr: str | None = None
    subtitle_ar: str | None = None
    subtitle_en: str | None = None
    description_fr: str | None = None
    description_ar: str | None = None
    description_en: str | None = None
    description_highlights_fr: str | None = None
    description_highlights_ar: str | None = None
    description_highlights_en: str | None = None
    price: float | None = None
    currency: str | None = "TND"
    category_id: str | None = None
    item_type_id: str | None = None
    company_id: str | None = None
    created_by: str | None = None
    updated_by: str | None = None
    # status is the canonical field (catalog.item_status enum): draft | published | archived
    status: str | None = "draft"
    reference: str | None = None
    internal_reference: str | None = None
    keywords: list | None = []
    usage_scenarios: list | None = []
    constraints: list | None = []
    city: str | None = None
    neighborhood: str | None = None
    nearby_poi: str | None = None
    positioning: str | None = None
    tone: str | None = None
    conditions_vente: str | None = None
    acompte_percent: float | None = None
    delai_livraison: str | None = None
    politique_annulation: str | None = None


class ItemUpdate(BaseModel):
    """Partial update model for PATCH-style PUT — all fields optional."""
    title_fr: str | None = None
    title_ar: str | None = None
    title_en: str | None = None
    subtitle_fr: str | None = None
    subtitle_ar: str | None = None
    subtitle_en: str | None = None
    description_fr: str | None = None
    description_ar: str | None = None
    description_en: str | None = None
    description_highlights_fr: str | None = None
    description_highlights_ar: str | None = None
    description_highlights_en: str | None = None
    price: float | None = None
    currency: str | None = None
    category_id: str | None = None
    item_type_id: str | None = None
    company_id: str | None = None
    updated_by: str | None = None
    status: str | None = None
    reference: str | None = None
    internal_reference: str | None = None
    keywords: list | None = None
    usage_scenarios: list | None = None
    constraints: list | None = None
    city: str | None = None
    neighborhood: str | None = None
    nearby_poi: str | None = None
    positioning: str | None = None
    tone: str | None = None
    conditions_vente: str | None = None
    acompte_percent: float | None = None
    delai_livraison: str | None = None
    politique_annulation: str | None = None


class VariantCreate(BaseModel):
    name: str
    price: float | None = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class VariantUpdate(BaseModel):
    name: str | None = None
    price: float | None = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class OptionCreate(BaseModel):
    name: str
    price: float | None = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class OptionUpdate(BaseModel):
    name: str | None = None
    price: float | None = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class TargetProfileCreate(BaseModel):
    name: str
    description: str | None = None

class ConditionsVente(BaseModel):
    conditions_vente: str | None = None
    acompte_percent: float | None = None
    delai_livraison: str | None = None
    politique_annulation: str | None = None

# CAT-01-03: Modèle pour attributs dynamiques
class AttributeSchema(BaseModel):
    key_name: str
    display_label: str
    attribute_type: str = "text"  # text | number | enum
    options: Optional[List[str]] = None
    is_filterable: bool = False
    company_id: str

class ItemAttributeCreate(BaseModel):
    key: str
    value_text: Optional[str] = None
    value_number: Optional[float] = None
    company_id: str

class TagCreate(BaseModel):
    name: str
    company_id: str

class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    company_id: str



# Note: CompanyCreate defined in company.py



# ─────────────────────────────────────────────
# ITEM ATTRIBUTES — schema per type (CAT-01-03)
# ─────────────────────────────────────────────

@router.get("/item-types/{type_id}/attribute-schema")
def get_attribute_schema(type_id: str):
    """CAT-01-03: Récupère le schéma d'attributs pour un type donné."""
    try:
        response = (
            supabase.postgrest.schema("catalog")
            .table("attribute_definitions")
            .select("id, attribute_name, data_type")
            .eq("item_type_id", type_id)
            .eq("is_active", True)
            .execute()
        )
        return response.data or []
    except Exception:
        return []




# ─────────────────────────────────────────────
# ITEM ATTRIBUTES (CAT-01-03)
# ─────────────────────────────────────────────

@router.get("/items/{item_id}/attributes")
def get_item_attributes(item_id: str):
    """CAT-01-03: Récupère toutes les valeurs d'attributs dynamiques d'une offre."""
    try:
        response = (
            supabase.postgrest.schema("catalog")
            .table("item_attribute_values")
            .select("*, attribute_definitions(*)")
            .eq("item_id", item_id)
            .execute()
        )
        return response.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/attributes/{attr_id}")
def delete_attribute(attr_id: str):
    """CAT-01-03: Désactiver (soft-delete) un attribut."""
    try:
        response = (
            supabase.postgrest.schema("catalog")
            .table("attribute_definitions")
            .update({"is_active": False})
            .eq("id", attr_id)
            .execute()
        )
        return {"deleted": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))



# ─────────────────────────────────────────────
# MEDIA SYSTEM (CAT-04)
# ─────────────────────────────────────────────

from fastapi import UploadFile, File, Form


@router.post("/items/{item_id}/media")
async def upload_item_media(
    item_id: str,
    company_id: str = Form(...),
    is_primary: bool = Form(False),
    caption_text: Optional[str] = Form(None),
    usage_context: str = Form("catalog"),
    file: UploadFile = File(...)
):
    """CAT-04: Upload d'un média et association avec l'offre."""
    try:
        import uuid
        file_ext = file.filename.split('.')[-1]
        file_name = f"{item_id}_{uuid.uuid4().hex}.{file_ext}"

        file_content = await file.read()
        res = supabase.storage.from_("catalog-images").upload(file_name, file_content)

        # L'URL retournée sous Python dépend de supbase-py. Si get_public_url ou simplement concat
        url_res = supabase.storage.from_("catalog-images").get_public_url(file_name)
        
        # En fonction de la version courante de supabase-py, l'URL peut être renvoyée direct, ou nécessiter un cast.
        
        payload = {
            "company_id": company_id,
            "item_id": item_id,
            "url": url_res,
            "is_primary": is_primary,
            "caption_text": caption_text,
            "usage_context": usage_context
        }
        db_res = (
            supabase.postgrest.schema("catalog")
            .table("media_assets")
            .insert(payload)
            .execute()
        )
        return db_res.data[0] if db_res.data else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/items/{item_id}/media")
def list_item_media(item_id: str):
    """CAT-04: Récupère la galerie d'images."""
    try:
        response = (
            supabase.postgrest.schema("catalog")
            .table("media_assets")
            .select("*")
            .eq("item_id", item_id)
            .order("is_primary", desc=True)
            .execute()
        )
        return response.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/media/{media_id}")
def delete_item_media(media_id: str):
    """CAT-04: Supprime un média (la BDD est en cascade pour retirer la ligne, mais le fichier reste)."""
    # Note: L'idéal serait de récupérer l'URL et demander à supabase de suppr le fichier
    try:
        response = (
            supabase.postgrest.schema("catalog")
            .table("media_assets")
            .delete()
            .eq("id", media_id)
            .execute()
        )
        return {"deleted": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────────
# PHASE 2 — CATEGORIES, TAGS, ITEM_TYPES, RELATIONS
# ─────────────────────────────────────────────────────────────────


# ┌─────────────────────────────────────┐
# │  SCHEMAS — PHASE 2                  │
# └─────────────────────────────────────┘

class CategoryCreate(BaseModel):
    name: str
    company_id: str
    parent_id: Optional[str] = None

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[str] = None

class TagCreateBody(BaseModel):
    name: str
    company_id: str

class TagUpdate(BaseModel):
    name: Optional[str] = None

class ItemTypeCreate(BaseModel):
    code: str
    label: str
    description: Optional[str] = None

class ItemTypeUpdate(BaseModel):
    label: Optional[str] = None
    description: Optional[str] = None

class ItemTagLink(BaseModel):
    tag_id: str
    company_id: str

class ItemCategoryLink(BaseModel):
    category_id: str
    company_id: str


# ┌─────────────────────────────────────┐
# │  CATEGORIES — full CRUD + tree      │
# └─────────────────────────────────────┘

@router.get("/categories")
def get_categories(company_id: str = Query(None)):
    """Liste les catégories. Retourne l'arbre (parent_id inclus)."""
    try:
        query = (
            supabase.postgrest.schema("catalog")
            .table("categories")
            .select("id, name, parent_id, created_at")
            .order("name")
        )
        if company_id:
            query = query.eq("company_id", company_id)
        data = query.execute().data or []
        return data
    except Exception as e:
        print(f"[categories] error: {e}")
        return []


@router.get("/categories/tree")
def get_categories_tree(company_id: str = Query(None)):
    """Retourne les catégories sous forme d'arbre imbriqué."""
    try:
        query = (
            supabase.postgrest.schema("catalog")
            .table("categories")
            .select("id, name, parent_id")
            .order("name")
        )
        if company_id:
            query = query.eq("company_id", company_id)
        rows = query.execute().data or []

        # Build tree
        id_map = {r["id"]: {**r, "children": []} for r in rows}
        roots = []
        for row in rows:
            pid = row.get("parent_id")
            if pid and pid in id_map:
                id_map[pid]["children"].append(id_map[row["id"]])
            else:
                roots.append(id_map[row["id"]])
        return roots
    except Exception as e:
        print(f"[categories/tree] error: {e}")
        return []


@router.get("/categories/{category_id}")
def get_category(category_id: str):
    try:
        resp = (
            supabase.postgrest.schema("catalog")
            .table("categories")
            .select("*")
            .eq("id", category_id)
            .single()
            .execute()
        )
        return resp.data
    except Exception:
        raise HTTPException(status_code=404, detail="Catégorie introuvable")


@router.post("/categories")
def create_category(body: CategoryCreate):
    try:
        payload = {k: v for k, v in body.dict().items() if v is not None}
        resp = (
            supabase.postgrest.schema("catalog")
            .table("categories")
            .insert(payload)
            .execute()
        )
        if not resp.data:
            raise HTTPException(status_code=400, detail="Erreur création catégorie")
        return resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/categories/{category_id}")
def update_category(category_id: str, body: CategoryUpdate):
    try:
        payload = {k: v for k, v in body.dict().items() if v is not None}
        if not payload:
            raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour")
        resp = (
            supabase.postgrest.schema("catalog")
            .table("categories")
            .update(payload)
            .eq("id", category_id)
            .execute()
        )
        if not resp.data:
            raise HTTPException(status_code=404, detail="Catégorie introuvable")
        return resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/categories/{category_id}")
def delete_category(category_id: str):
    """Supprime une catégorie (les enfants deviennent racines — parent_id mis à null)."""
    try:
        # Detach children
        supabase.postgrest.schema("catalog").table("categories").update({"parent_id": None}).eq("parent_id", category_id).execute()
        # Delete
        supabase.postgrest.schema("catalog").table("categories").delete().eq("id", category_id).execute()
        return {"deleted": True, "id": category_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ┌─────────────────────────────────────┐
# │  TAGS — full CRUD                   │
# └─────────────────────────────────────┘

@router.get("/tags")
def get_tags(company_id: str = Query(None)):
    try:
        query = (
            supabase.postgrest.schema("catalog")
            .table("tags")
            .select("id, name, created_at")
            .order("name")
        )
        if company_id:
            query = query.eq("company_id", company_id)
        return query.execute().data or []
    except Exception:
        return []


@router.post("/tags")
def create_tag(body: TagCreateBody):
    try:
        resp = (
            supabase.postgrest.schema("catalog")
            .table("tags")
            .insert({"name": body.name, "company_id": body.company_id})
            .execute()
        )
        if not resp.data:
            raise HTTPException(status_code=400, detail="Erreur création tag")
        return resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/tags/{tag_id}")
def update_tag(tag_id: str, body: TagUpdate):
    try:
        payload = {k: v for k, v in body.dict().items() if v is not None}
        resp = (
            supabase.postgrest.schema("catalog")
            .table("tags")
            .update(payload)
            .eq("id", tag_id)
            .execute()
        )
        if not resp.data:
            raise HTTPException(status_code=404, detail="Tag introuvable")
        return resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/tags/{tag_id}")
def delete_tag(tag_id: str):
    try:
        # Remove all item_tags links first
        supabase.postgrest.schema("catalog").table("item_tags").delete().eq("tag_id", tag_id).execute()
        supabase.postgrest.schema("catalog").table("tags").delete().eq("id", tag_id).execute()
        return {"deleted": True, "id": tag_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ┌─────────────────────────────────────┐
# │  ITEM_TYPES — read + partial manage │
# └─────────────────────────────────────┘

@router.get("/item-types")
def list_item_types():
    """Liste tous les types d'offres disponibles."""
    try:
        response = (
            supabase.postgrest.schema("catalog")
            .table("item_types")
            .select("id, code, label, description, config, created_at")
            .order("label")
            .execute()
        )
        result = []
        for row in (response.data or []):
            result.append({
                "id":          row["id"],
                "code":        row.get("code", ""),
                "label":       row.get("label", ""),
                "name":        row.get("label", row.get("code", "")),  # frontend alias
                "description": row.get("description"),
                "config":      row.get("config"),
            })
        return result
    except Exception as e:
        print(f"[item-types] error: {e}")
        return []


@router.post("/item-types")
def create_item_type(body: ItemTypeCreate):
    """Crée un nouveau type d'offre (code unique requis)."""
    try:
        payload = {k: v for k, v in body.dict().items() if v is not None}
        resp = (
            supabase.postgrest.schema("catalog")
            .table("item_types")
            .insert(payload)
            .execute()
        )
        if not resp.data:
            raise HTTPException(status_code=400, detail="Erreur création type")
        return resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/item-types/{type_id}")
def update_item_type(type_id: str, body: ItemTypeUpdate):
    try:
        payload = {k: v for k, v in body.dict().items() if v is not None}
        if not payload:
            raise HTTPException(status_code=400, detail="Aucun champ")
        resp = (
            supabase.postgrest.schema("catalog")
            .table("item_types")
            .update(payload)
            .eq("id", type_id)
            .execute()
        )
        if not resp.data:
            raise HTTPException(status_code=404, detail="Type introuvable")
        return resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ┌─────────────────────────────────────┐
# │  ITEM ↔ TAGS  relations             │
# └─────────────────────────────────────┘

@router.get("/items/{item_id}/tags")
def get_item_tags(item_id: str):
    """Retourne les tags liés à une offre."""
    try:
        resp = (
            supabase.postgrest.schema("catalog")
            .table("item_tags")
            .select("id, tag_id, tags(id, name)")
            .eq("item_id", item_id)
            .execute()
        )
        return resp.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/items/{item_id}/tags")
def add_tag_to_item(item_id: str, body: ItemTagLink):
    """Associe un tag existant à une offre."""
    try:
        # Check if already linked
        existing = (
            supabase.postgrest.schema("catalog")
            .table("item_tags")
            .select("id")
            .eq("item_id", item_id)
            .eq("tag_id", body.tag_id)
            .execute()
        )
        if existing.data:
            return existing.data[0]  # idempotent

        resp = (
            supabase.postgrest.schema("catalog")
            .table("item_tags")
            .insert({"item_id": item_id, "tag_id": body.tag_id, "company_id": body.company_id})
            .execute()
        )
        return resp.data[0] if resp.data else {}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/items/{item_id}/tags/{tag_id}")
def remove_tag_from_item(item_id: str, tag_id: str):
    """Dissocie un tag d'une offre."""
    try:
        supabase.postgrest.schema("catalog").table("item_tags").delete().eq("item_id", item_id).eq("tag_id", tag_id).execute()
        return {"deleted": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/items/{item_id}/tags/sync")
def sync_item_tags(item_id: str, body: dict):
    """Remplace tous les tags d'une offre par la liste fournie (tag_ids: list, company_id: str)."""
    try:
        tag_ids = body.get("tag_ids", [])
        company_id = body.get("company_id")
        if not company_id:
            raise HTTPException(status_code=400, detail="company_id requis")

        # Delete existing
        supabase.postgrest.schema("catalog").table("item_tags").delete().eq("item_id", item_id).execute()

        # Re-insert
        if tag_ids:
            rows = [{"item_id": item_id, "tag_id": tid, "company_id": company_id} for tid in tag_ids]
            supabase.postgrest.schema("catalog").table("item_tags").insert(rows).execute()

        return {"synced": True, "count": len(tag_ids)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ┌─────────────────────────────────────┐
# │  ITEM ↔ CATEGORIES  relations       │
# └─────────────────────────────────────┘

@router.get("/items/{item_id}/categories")
def get_item_categories(item_id: str):
    """Retourne la catégorie liée à une offre (désormais mono-catégorie via items.category_id)."""
    try:
        resp = (
            supabase.postgrest.schema("catalog")
            .table("items")
            .select("category_id, categories(id, name, parent_id)")
            .eq("id", item_id)
            .single()
            .execute()
        )
        if resp.data and resp.data["category_id"]:
            # Format according to what frontend expects, wrapping it in a list to keep compatibility
            return [{
                "id": f"link_{item_id}_{resp.data['category_id']}",
                "category_id": resp.data["category_id"],
                "categories": resp.data["categories"]
            }]
        return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/items/{item_id}/categories/sync")
def sync_item_categories(item_id: str, body: dict):
    """Met à jour la catégorie d'une offre (prend le premier de category_ids: list)."""
    try:
        category_ids = body.get("category_ids", [])
        if not category_ids:
            # Clear category
            supabase.postgrest.schema("catalog").table("items").update({"category_id": None}).eq("id", item_id).execute()
            return {"synced": True, "count": 0}

        # Update primary category_id on items table
        supabase.postgrest.schema("catalog").table("items").update({"category_id": category_ids[0]}).eq("id", item_id).execute()

        return {"synced": True, "count": 1}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ┌─────────────────────────────────────┐
# │  COLLECTIONS — full CRUD            │
# └─────────────────────────────────────┘

@router.get("/collections")
def get_collections(company_id: str = Query(None)):
    try:
        query = supabase.postgrest.schema("catalog").table("collections").select("id, name, description, created_at").order("name")
        if company_id:
            query = query.eq("company_id", company_id)
        return query.execute().data or []
    except Exception:
        return []


@router.post("/collections")
def create_collection(body: CollectionCreate):
    try:
        payload = {k: v for k, v in body.dict().items() if v is not None}
        resp = (
            supabase.postgrest.schema("catalog")
            .table("collections")
            .insert(payload)
            .execute()
        )
        if not resp.data:
            raise HTTPException(status_code=400, detail="Erreur création collection")
        return resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/collections/{collection_id}")
def delete_collection(collection_id: str):
    try:
        supabase.postgrest.schema("catalog").table("collection_items").delete().eq("collection_id", collection_id).execute()
        supabase.postgrest.schema("catalog").table("collections").delete().eq("id", collection_id).execute()
        return {"deleted": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─────────────────────────────────────────────
# ITEMS — PHASE 1
# ─────────────────────────────────────────────

@router.get("/items")
def list_items(
    company_id:    str   = Query(None),
    category_id:   str   = Query(None),
    item_type_id:  str   = Query(None),
    status:        str   = Query(None),   # draft | published | archived
    city:          str   = Query(None),
    price_min:     float = Query(None),
    price_max:     float = Query(None),
    search:        str   = Query(None),   # full-text search on title_fr
    page:          int   = Query(1, ge=1),
    page_size:     int   = Query(20, ge=1, le=100),
):
    """Liste les offres avec filtres complets et pagination."""
    try:
        query = (
            supabase.postgrest.schema("catalog")
            .from_("items")
            .select("*, categories(name), item_types(label)", count="exact")
            .order("created_at", desc=True)
        )
        if company_id:   query = query.eq("company_id", company_id)
        if category_id:  query = query.eq("category_id", category_id)
        if item_type_id: query = query.eq("item_type_id", item_type_id)
        if status:       query = query.eq("status", status)
        if city:         query = query.ilike("city", f"%{city}%")
        if price_min is not None: query = query.gte("price", price_min)
        if price_max is not None: query = query.lte("price", price_max)
        if search:       query = query.ilike("title_fr", f"%{search}%")

        # Pagination
        offset = (page - 1) * page_size
        query = query.range(offset, offset + page_size - 1)

        resp = query.execute()
        return {
            "data": resp.data or [],
            "total": resp.count or 0,
            "page": page,
            "page_size": page_size,
        }
    except Exception as e:
        print(f"[list_items] error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/items/{item_id}")
def get_item(item_id: str):
    """Retourne une offre complète avec catégorie et type."""
    try:
        response = (
            supabase.postgrest.schema("catalog")
            .table("items")
            .select("*, categories(name), item_types(label)")
            .eq("id", item_id)
            .single()
            .execute()
        )
        return response.data
    except Exception as e:
        raise HTTPException(status_code=404, detail="Offre introuvable")


@router.post("/items")
def create_item(item: Item):
    """Crée une nouvelle offre. status par défaut = 'draft'."""
    try:
        payload = {k: v for k, v in item.dict().items() if v is not None}
        # Ensure status default
        payload.setdefault("status", "draft")
        response = (
            supabase.postgrest.schema("catalog")
            .table("items")
            .insert(payload)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=400, detail="Erreur création offre")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/items/{item_id}")
def update_item(item_id: str, item: ItemUpdate):
    """Met à jour une offre existante (champs partiels acceptés)."""
    try:
        payload = {k: v for k, v in item.dict().items() if v is not None}
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
            raise HTTPException(status_code=404, detail="Offre introuvable")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/items/{item_id}")
def delete_item(item_id: str):
    """Supprime une offre et ses médias associés."""
    try:
        # Delete media first (FK constraint)
        supabase.postgrest.schema("catalog").table("media_assets").delete().eq("item_id", item_id).execute()
        # Delete tags links
        supabase.postgrest.schema("catalog").table("item_tags").delete().eq("item_id", item_id).execute()
        # Delete variants & options
        supabase.postgrest.schema("catalog").table("item_variants").delete().eq("item_id", item_id).execute()
        supabase.postgrest.schema("catalog").table("item_options").delete().eq("item_id", item_id).execute()
        # Delete target profiles links
        supabase.postgrest.schema("catalog").table("item_target_profiles").delete().eq("item_id", item_id).execute()
        # Delete attribute values
        supabase.postgrest.schema("catalog").table("item_attribute_values").delete().eq("item_id", item_id).execute()
        # Delete item benefits
        supabase.postgrest.schema("catalog").table("item_benefits").delete().eq("item_id", item_id).execute()
        # Delete item
        resp = supabase.postgrest.schema("catalog").table("items").delete().eq("id", item_id).execute()
        return {"deleted": True, "id": item_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/items-with-images")
def list_items_with_images(
    company_id:     str   = Query(None),
    category_id:    str   = Query(None),
    item_type_id:   str   = Query(None),
    status:         str   = Query(None),
    city:           str   = Query(None),
    price_min:      float = Query(None),
    price_max:      float = Query(None),
    search:         str   = Query(None),
    page:           int   = Query(1, ge=1),
    page_size:      int   = Query(20, ge=1, le=100),
    favorites_only: bool  = Query(False),
    user_id:        str   = Query(None),
):
    """Fetch items avec images, tags, filtres et pagination."""
    try:
        query = (
            supabase.postgrest.schema("catalog")
            .from_("items")
            .select("*, categories(name), item_types(label)", count="exact")
            .order("created_at", desc=True)
        )
        if company_id:   query = query.eq("company_id", company_id)
        if category_id:  query = query.eq("category_id", category_id)
        if item_type_id: query = query.eq("item_type_id", item_type_id)
        if status:       query = query.eq("status", status)
        if city:         query = query.ilike("city", f"%{city}%")
        if price_min is not None: query = query.gte("price", price_min)
        if price_max is not None: query = query.lte("price", price_max)
        if search:       query = query.ilike("title_fr", f"%{search}%")

        if favorites_only and user_id:
            favs_resp = supabase.postgrest.schema("catalog").table("favorites").select("item_id").eq("user_id", user_id).execute()
            fav_ids = [f["item_id"] for f in favs_resp.data or []]
            if not fav_ids:
                return {"data": [], "total": 0, "page": page, "page_size": page_size}
            query = query.in_("id", fav_ids)

        offset = (page - 1) * page_size
        query = query.range(offset, offset + page_size - 1)

        resp = query.execute()
        items = resp.data or []
        total = resp.count or 0

        # Fetch all media (filter by company if provided)
        media_q = supabase.postgrest.schema("catalog").from_("media_assets").select("item_id, url")
        media = media_q.execute().data or []
        media_map = {}
        for m in media:
            if str(m["item_id"]) not in media_map:
                media_map[str(m["item_id"])] = m["url"]

        # Fetch tags
        tags_q = supabase.postgrest.schema("catalog").from_("item_tags").select("item_id, tags(name)")
        if company_id:
            tags_q = tags_q.eq("company_id", company_id)
        item_tags = tags_q.execute().data or []

        tags_map: dict = {}
        for it in item_tags:
            iid = str(it["item_id"])
            tname = it.get("tags", {}).get("name")
            if tname:
                tags_map.setdefault(iid, []).append(tname)

        result = []
        for item in items:
            iid = str(item.get("id"))
            result.append({
                "id":             item.get("id"),
                "title_fr":       item.get("title_fr"),
                "description_fr": item.get("description_fr"),
                "price":          item.get("price"),
                "currency":       item.get("currency", "TND"),
                "status":         item.get("status"),
                "category":       item.get("categories", {}).get("name") if item.get("categories") else None,
                "category_id":    item.get("category_id"),
                "item_type":      item.get("item_types", {}).get("label") if item.get("item_types") else None,
                "item_type_id":   item.get("item_type_id"),
                "city":           item.get("city"),
                "neighborhood":   item.get("neighborhood"),
                "created_at":     item.get("created_at"),
                "image_url":      media_map.get(iid),
                "tags":           tags_map.get(iid, []),
            })

        return {
            "data": result,
            "total": total,
            "page": page,
            "page_size": page_size,
        }
    except Exception as e:
        print(f"[items-with-images] error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
def get_categories(company_id: str = Query(None)):
    """Liste les catégories de l'entreprise active."""
    try:
        query = (
            supabase.postgrest.schema("catalog")
            .table("categories")
            .select("id,name,parent_id")
            .order("name")
        )
        if company_id:
            query = query.eq("company_id", company_id)
        data = query.execute().data or []
        # Deduplicate by name to avoid UI repetition when multiple rows share same name
        seen_names = set()
        unique = []
        for row in data:
            if row["name"] not in seen_names:
                seen_names.add(row["name"])
                unique.append(row)
        return unique
    except Exception as e:
        print(f"[categories] error: {e}")
        return []



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
        "start_date": variant.start_date,
        "end_date":   variant.end_date,
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
        "start_date": option.start_date,
        "end_date":   option.end_date,
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


# ─────────────────────────────────────────────
# ITEM ← SUPPLIERS (reverse lookup for item detail page)
# ─────────────────────────────────────────────

class ItemSupplierLink(BaseModel):
    supplier_id: str
    commission: Optional[float] = None


@router.get("/items/{item_id}/suppliers")
def get_item_suppliers(item_id: str):
    """Retourne tous les fournisseurs associés à une offre avec leur commission."""
    try:
        response = (
            supabase.postgrest.schema("catalog")
            .table("item_suppliers")
            .select("id, supplier_id, commission, created_at, suppliers(id, name, description)")
            .eq("item_id", item_id)
            .execute()
        )
        return response.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/items/{item_id}/suppliers")
def add_supplier_to_item(item_id: str, body: ItemSupplierLink):
    """Associe un fournisseur à une offre (avec commission)."""
    try:
        item_resp = (
            supabase.postgrest.schema("catalog")
            .table("items")
            .select("id, company_id")
            .eq("id", item_id)
            .maybe_single()
            .execute()
        )
        if not item_resp.data:
            raise HTTPException(status_code=404, detail="Offre introuvable")

        # idempotency check
        existing = (
            supabase.postgrest.schema("catalog")
            .table("item_suppliers")
            .select("id")
            .eq("item_id", item_id)
            .eq("supplier_id", body.supplier_id)
            .execute()
        )
        if existing.data:
            raise HTTPException(status_code=409, detail="Ce fournisseur est déjà lié à cette offre")

        payload = {
            "item_id": item_id,
            "supplier_id": body.supplier_id,
            "company_id": item_resp.data["company_id"],
        }
        if body.commission is not None:
            payload["commission"] = body.commission

        response = (
            supabase.postgrest.schema("catalog")
            .table("item_suppliers")
            .insert(payload)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=400, detail="Erreur liaison")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/items/{item_id}/suppliers/{supplier_id}")
def remove_supplier_from_item(item_id: str, supplier_id: str):
    """Retire un fournisseur d'une offre."""
    try:
        supabase.postgrest.schema("catalog").table("item_suppliers").delete().eq("item_id", item_id).eq("supplier_id", supplier_id).execute()
        return {"deleted": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

