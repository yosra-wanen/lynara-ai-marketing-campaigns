from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from app.api.catalog import supabase
import uuid

router = APIRouter(prefix="", tags=["advanced"])

# ─────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────

class SavedViewCreate(BaseModel):
    company_id: str
    user_id: str
    name: str
    view_type: str = "list"
    filters: Optional[Dict[str, Any]] = {}
    is_default: Optional[bool] = False

class SavedViewUpdate(BaseModel):
    name: Optional[str] = None
    view_type: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None
    is_default: Optional[bool] = None

class FavoriteCreate(BaseModel):
    company_id: str
    user_id: str
    item_id: str


# ─────────────────────────────────────────────
# SAVED VIEWS
# ─────────────────────────────────────────────

@router.get("/saved-views")
def list_saved_views(company_id: str, user_id: str):
    try:
        response = (
            supabase.postgrest
            .schema("catalog")
            .table("saved_views")
            .select("*")
            .eq("company_id", company_id)
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return response.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/saved-views")
def create_saved_view(payload: SavedViewCreate):
    try:
        if payload.is_default:
            # Set others to false
            supabase.postgrest.schema("catalog").table("saved_views").update({"is_default": False}).eq("user_id", payload.user_id).execute()
            
        data = payload.dict()
        response = supabase.postgrest.schema("catalog").table("saved_views").insert(data).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/saved-views/{view_id}")
def update_saved_view(view_id: str, payload: SavedViewUpdate, user_id: str = Query(...)):
    try:
        data = {k: v for k, v in payload.dict().items() if v is not None}
        if payload.is_default is True:
            supabase.postgrest.schema("catalog").table("saved_views").update({"is_default": False}).eq("user_id", user_id).execute()
            
        response = supabase.postgrest.schema("catalog").table("saved_views").update(data).eq("id", view_id).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/saved-views/{view_id}")
def delete_saved_view(view_id: str):
    try:
        supabase.postgrest.schema("catalog").table("saved_views").delete().eq("id", view_id).execute()
        return {"deleted": True, "id": view_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# FAVORITES
# ─────────────────────────────────────────────

@router.get("/favorites")
def list_favorites(user_id: str):
    """
    Returns item details for favorite items of this user.
    """
    try:
        response = (
            supabase.postgrest
            .schema("catalog")
            .table("favorites")
            .select("id, item_id, items(*)")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        
        # Format response a bit
        res = []
        for row in response.data or []:
            if row.get("items"):
                res.append(row["items"])
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/favorites/ids")
def get_favorite_ids(user_id: str):
    """
    Just returns a list of favorite item IDs.
    """
    try:
        response = (
            supabase.postgrest
            .schema("catalog")
            .table("favorites")
            .select("item_id")
            .eq("user_id", user_id)
            .execute()
        )
        return [row["item_id"] for row in (response.data or [])]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/favorites")
def toggle_favorite(payload: FavoriteCreate):
    """
    Toggles favorite for an item.
    """
    try:
        # Check if exists
        check = supabase.postgrest.schema("catalog").table("favorites").select("id").eq("user_id", payload.user_id).eq("item_id", payload.item_id).execute()
        if check.data:
            # remove it
            supabase.postgrest.schema("catalog").table("favorites").delete().eq("id", check.data[0]["id"]).execute()
            return {"favorite": False}
        else:
            # insert it
            supabase.postgrest.schema("catalog").table("favorites").insert(payload.dict()).execute()
            return {"favorite": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# ITEM CLONING (DUPLICATION) & COMPLETENESS
# ─────────────────────────────────────────────

@router.post("/items/{item_id}/clone")
def clone_item(item_id: str):
    """
    Clones the specified item and returns the new item.
    We just copy the base item and maybe its links.
    """
    try:
        # 1. Fetch item base data
        item_resp = supabase.postgrest.schema("catalog").table("items").select("*").eq("id", item_id).execute()
        if not item_resp.data:
            raise HTTPException(status_code=404, detail="Item not found")
        
        item_data = item_resp.data[0]
        # Remove primary keys and timestamps
        del item_data["id"]
        if "created_at" in item_data: del item_data["created_at"]
        if "updated_at" in item_data: del item_data["updated_at"]
        
        # Modify title
        item_data["title_fr"] = item_data.get("title_fr", "Copie") + " (Copie)"
        item_data["status"] = "draft" # Copies are always draft
        
        # Extract metadata
        company_id = item_data.get("company_id")
        user_id = item_data.get("user_id")
        
        # 2. Insert new item
        new_resp = supabase.postgrest.schema("catalog").table("items").insert(item_data).execute()
        new_item = new_resp.data[0]
        new_id = new_item["id"]
        
        # Try to clone some relations. Since it's a lightweight clone, we can try to clone:
        # - Item tags
        tags_resp = supabase.postgrest.schema("catalog").table("item_tags").select("tag_id").eq("item_id", item_id).execute()
        if tags_resp.data:
            new_tags = [{"item_id": new_id, "tag_id": t["tag_id"]} for t in tags_resp.data]
            supabase.postgrest.schema("catalog").table("item_tags").insert(new_tags).execute()
            
        # - Images
        images_resp = supabase.postgrest.schema("catalog").table("images").select("file_path, context, title, alt_text, sort_order, is_primary").eq("item_id", item_id).execute()
        if images_resp.data:
            for i in images_resp.data:
                i["item_id"] = new_id
            supabase.postgrest.schema("catalog").table("images").insert(images_resp.data).execute()
            
        return new_item
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/items/{item_id}/completeness")
def get_item_completeness(item_id: str):
    """
    Calculates a score (0 to 100) on how complete the item's profile is.
    """
    try:
        item_resp = supabase.postgrest.schema("catalog").table("items").select("title_fr, description_fr, price, status").eq("id", item_id).execute()
        if not item_resp.data:
             return {"score": 0, "missing": ["Item not found"]}
             
        item = item_resp.data[0]
        score = 0
        missing = []
        
        # Rules (Example logical breakdown)
        if item.get("title_fr"): score += 20
        else: missing.append("Titre manquant")
        
        if item.get("description_fr"): score += 20
        else: missing.append("Description manquante")
        
        if item.get("price") is not None: score += 20
        else: missing.append("Prix manquant")
        
        # Check images
        from app.api.catalog import supabase as get_media
        img = get_media.postgrest.schema("catalog").table("images").select("id").eq("item_id", item_id).execute()
        if img.data and len(img.data) > 0: score += 20
        else: missing.append("Aucune image")
        
        # Check conditions
        cond = get_media.postgrest.schema("catalog").table("commercial_conditions").select("id").eq("item_id", item_id).execute()
        if cond.data and len(cond.data) > 0: score += 10
        else: missing.append("Conditions de vente manquantes")
        
        # Assume everything else completes the 10%
        score += 10
        
        return {"score": score, "missing": missing, "status": item.get("status")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
