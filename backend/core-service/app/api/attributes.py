from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from app.api.catalog import supabase
import postgrest

router = APIRouter(prefix="", tags=["attributes"])

# ─────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────

class AttributeDefinitionCreate(BaseModel):
    company_id: str
    category_id: Optional[str] = None
    item_type_id: Optional[str] = None
    attribute_name: str
    display_label: str
    data_type: str # 'number', 'text', 'enum', 'boolean'
    config: Optional[Dict[str, Any]] = {}
    is_active: Optional[bool] = True

class AttributeDefinitionUpdate(BaseModel):
    display_label: Optional[str] = None
    data_type: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class ItemAttributeValue(BaseModel):
    attribute_id: str
    company_id: str
    value: Any

class ItemAttributeValuesUpdate(BaseModel):
    values: List[ItemAttributeValue]


# ─────────────────────────────────────────────
# ATTRIBUTE DEFINITIONS — CRUD
# ─────────────────────────────────────────────

@router.get("/attributes")
def list_attribute_definitions(company_id: str, category_id: Optional[str] = None):
    """
    Liste les définitions d'attributs pour une entreprise. 
    Si category_id est fourni, on peut filtrer (ou renvoyer ceux liés à cette catégorie + les globaux).
    """
    try:
        query = (
            supabase.postgrest
            .schema("catalog")
            .table("attribute_definitions")
            .select("*")
            .eq("company_id", company_id)
            .eq("is_active", True)
        )
        if category_id:
            # Optionally fetch category specific OR global (category_id is null)
            query = query.or_(f"category_id.eq.{category_id},category_id.is.null")
        
        response = query.order("created_at").execute()
        return response.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/attributes")
def create_attribute_definition(payload: AttributeDefinitionCreate):
    try:
        data = payload.dict()
        response = (
            supabase.postgrest
            .schema("catalog")
            .table("attribute_definitions")
            .insert(data)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=400, detail="Erreur création attribut")
        return response.data[0]
    except postgrest.exceptions.APIError as e:
        raise HTTPException(status_code=400, detail=f"Erreur Supabase: {e.message}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/attributes/{attribute_id}")
def update_attribute_definition(attribute_id: str, payload: AttributeDefinitionUpdate):
    try:
        data = {k: v for k, v in payload.dict().items() if v is not None}
        if not data:
            raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour")
        response = (
            supabase.postgrest.schema("catalog")
            .table("attribute_definitions")
            .update(data)
            .eq("id", attribute_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Attribut non trouvé")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/attributes/{attribute_id}")
def delete_attribute_definition(attribute_id: str):
    try:
        # We might soft-delete instead of hard-delete to keep history, or just cascade
        response = (
            supabase.postgrest.schema("catalog")
            .table("attribute_definitions")
            .update({"is_active": False}) # Soft delete
            .eq("id", attribute_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Attribut non trouvé")
        return {"deleted": True, "id": attribute_id, "soft_deleted": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# ITEM ATTRIBUTE VALUES — GET & UPSERT
# ─────────────────────────────────────────────

@router.get("/items/{item_id}/attributes")
def get_item_attribute_values(item_id: str):
    """
    Retourne les valeurs d'attributs pour une offre donnée,
    en y joignant la définition de l'attribut pour le frontend.
    """
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


@router.put("/items/{item_id}/attributes")
def upsert_item_attribute_values(item_id: str, payload: ItemAttributeValuesUpdate):
    """
    Mets à jour (upsert) en lot les valeurs d'attributs dynamiques d'une offre.
    """
    if not payload.values:
        return {"upserted": 0}

    # Fetch attribute definitions mapping to validate types
    attr_ids = [v.attribute_id for v in payload.values]
    try:
        defs_resp = (
            supabase.postgrest.schema("catalog")
            .table("attribute_definitions")
            .select("id, data_type")
            .in_("id", attr_ids)
            .execute()
        )
        defs_map = {d["id"]: d["data_type"] for d in (defs_resp.data or [])}
        
        upsert_payload = []
        for v in payload.values:
            upsert_payload.append({
                "item_id": item_id,
                "attribute_id": v.attribute_id,
                "company_id": v.company_id, # Frontend should provide this or we fetch it
                "value": v.value,
            })
        
        if upsert_payload:
            # We use an upsert operation
            response = (
                supabase.postgrest.schema("catalog")
                .table("item_attribute_values")
                .upsert(upsert_payload, on_conflict="item_id,attribute_id")
                .execute()
            )
            return {"upserted": len(upsert_payload)}
        return {"upserted": 0}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
