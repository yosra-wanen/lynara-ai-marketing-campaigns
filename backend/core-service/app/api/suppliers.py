from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from app.api.catalog import supabase
import postgrest

router = APIRouter(prefix="", tags=["suppliers"])


# ─────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────

class SupplierCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    company_id: str

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class ContactCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company_id: str

class ContactUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

class ItemLink(BaseModel):
    item_id: str
    commission: Optional[float] = None  # commission %

class ItemLinkUpdate(BaseModel):
    commission: Optional[float] = None


# ─────────────────────────────────────────────
# SUPPLIERS — CRUD
# ─────────────────────────────────────────────

@router.get("/")
def list_suppliers(company_id: Optional[str] = Query(None)):
    """Liste les fournisseurs filtrés par company_id."""
    try:
        query = (
            supabase.postgrest
            .schema("catalog")
            .from_("suppliers")
            .select("id, name, description, created_at")
            .order("name")
        )
        if company_id:
            query = query.eq("company_id", company_id)
        return query.execute().data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
def create_supplier(payload: SupplierCreate):
    try:
        data = {k: v for k, v in payload.dict().items() if v is not None}
        response = (
            supabase.postgrest
            .schema("catalog")
            .table("suppliers")
            .insert(data)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=400, detail="Erreur création fournisseur")
        return response.data[0]
    except HTTPException:
        raise
    except postgrest.exceptions.APIError as e:
        raise HTTPException(status_code=400, detail=f"Erreur Supabase: {e.message}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{supplier_id}")
def get_supplier(supplier_id: str):
    try:
        response = (
            supabase.postgrest.schema("catalog")
            .table("suppliers")
            .select("*")
            .eq("id", supplier_id)
            .single()
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Fournisseur non trouvé")
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{supplier_id}")
def update_supplier(supplier_id: str, payload: SupplierUpdate):
    try:
        data = {k: v for k, v in payload.dict().items() if v is not None}
        if not data:
            raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour")
        response = (
            supabase.postgrest.schema("catalog")
            .table("suppliers")
            .update(data)
            .eq("id", supplier_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Fournisseur non trouvé")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: str):
    try:
        # Remove all item links and contacts first
        supabase.postgrest.schema("catalog").table("item_suppliers").delete().eq("supplier_id", supplier_id).execute()
        supabase.postgrest.schema("catalog").table("supplier_contacts").delete().eq("supplier_id", supplier_id).execute()
        response = (
            supabase.postgrest.schema("catalog")
            .table("suppliers")
            .delete()
            .eq("id", supplier_id)
            .execute()
        )
        return {"deleted": True, "id": supplier_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# SUPPLIER CONTACTS — CRUD
# ─────────────────────────────────────────────

@router.get("/{supplier_id}/contacts")
def list_supplier_contacts(supplier_id: str):
    try:
        response = (
            supabase.postgrest.schema("catalog")
            .table("supplier_contacts")
            .select("id, name, email, phone, created_at")
            .eq("supplier_id", supplier_id)
            .order("created_at")
            .execute()
        )
        return response.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{supplier_id}/contacts")
def add_contact_to_supplier(supplier_id: str, payload: ContactCreate):
    try:
        # Get company_id from supplier
        supplier_resp = (
            supabase.postgrest.schema("catalog")
            .table("suppliers")
            .select("company_id")
            .eq("id", supplier_id)
            .single()
            .execute()
        )
        if not supplier_resp.data:
            raise HTTPException(status_code=404, detail="Fournisseur non trouvé")

        company_id = supplier_resp.data["company_id"]
        data = {k: v for k, v in payload.dict().items() if v is not None and k != "company_id"}
        data["supplier_id"] = supplier_id
        data["company_id"] = company_id

        response = (
            supabase.postgrest.schema("catalog")
            .table("supplier_contacts")
            .insert(data)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=400, detail="Erreur création contact")
        return response.data[0]
    except HTTPException:
        raise
    except postgrest.exceptions.APIError as e:
        raise HTTPException(status_code=400, detail=f"Erreur RLS: {e.message}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{supplier_id}/contacts/{contact_id}")
def update_contact(supplier_id: str, contact_id: str, payload: ContactUpdate):
    try:
        data = {k: v for k, v in payload.dict().items() if v is not None}
        if not data:
            raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour")
        response = (
            supabase.postgrest.schema("catalog")
            .table("supplier_contacts")
            .update(data)
            .eq("id", contact_id)
            .eq("supplier_id", supplier_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Contact introuvable")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{supplier_id}/contacts/{contact_id}")
def delete_supplier_contact(supplier_id: str, contact_id: str):
    try:
        supabase.postgrest.schema("catalog").table("supplier_contacts").delete().eq("id", contact_id).eq("supplier_id", supplier_id).execute()
        return {"deleted": True, "id": contact_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# SUPPLIER ↔ ITEMS — relation with commission
# ─────────────────────────────────────────────

@router.get("/{supplier_id}/items")
def list_supplier_items(supplier_id: str):
    """Liste les offres liées à un fournisseur avec commission."""
    try:
        response = (
            supabase.postgrest.schema("catalog")
            .table("item_suppliers")
            .select("id, item_id, commission, created_at, items(id, title_fr, price, status)")
            .eq("supplier_id", supplier_id)
            .execute()
        )
        return response.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{supplier_id}/items")
def add_item_to_supplier(supplier_id: str, payload: ItemLink):
    """Associe une offre à un fournisseur avec commission optionnelle."""
    try:
        supplier_resp = (
            supabase.postgrest.schema("catalog")
            .table("suppliers")
            .select("company_id")
            .eq("id", supplier_id)
            .single()
            .execute()
        )
        if not supplier_resp.data:
            raise HTTPException(status_code=404, detail="Fournisseur non trouvé")

        company_id = supplier_resp.data["company_id"]

        # Check if already linked
        existing = (
            supabase.postgrest.schema("catalog")
            .table("item_suppliers")
            .select("id")
            .eq("supplier_id", supplier_id)
            .eq("item_id", payload.item_id)
            .execute()
        )
        if existing.data:
            raise HTTPException(status_code=409, detail="Cette offre est déjà liée à ce fournisseur")

        data = {
            "supplier_id": supplier_id,
            "item_id": payload.item_id,
            "company_id": company_id,
        }
        if payload.commission is not None:
            data["commission"] = payload.commission

        response = (
            supabase.postgrest.schema("catalog")
            .table("item_suppliers")
            .insert(data)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=400, detail="Erreur liaison fournisseur-offre")
        return response.data[0]
    except HTTPException:
        raise
    except postgrest.exceptions.APIError as e:
        raise HTTPException(status_code=400, detail=f"Erreur: {e.message}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{supplier_id}/items/{item_id}")
def update_item_supplier_commission(supplier_id: str, item_id: str, payload: ItemLinkUpdate):
    """Met à jour la commission d'un lien fournisseur-offre."""
    try:
        data = {k: v for k, v in payload.dict().items() if v is not None}
        if not data:
            raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour")
        response = (
            supabase.postgrest.schema("catalog")
            .table("item_suppliers")
            .update(data)
            .eq("supplier_id", supplier_id)
            .eq("item_id", item_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Lien introuvable")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{supplier_id}/items/{item_id}")
def remove_item_from_supplier(supplier_id: str, item_id: str):
    """Retire une offre d'un fournisseur."""
    try:
        supabase.postgrest.schema("catalog").table("item_suppliers").delete().eq("supplier_id", supplier_id).eq("item_id", item_id).execute()
        return {"deleted": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# ITEM ← SUPPLIERS (reverse lookup)
# ─────────────────────────────────────────────

@router.get("/items/{item_id}/suppliers")
def get_item_suppliers(item_id: str):
    """Retourne tous les fournisseurs d'une offre avec leur commission."""
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