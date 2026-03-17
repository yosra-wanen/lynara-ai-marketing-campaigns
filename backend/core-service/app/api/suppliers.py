from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.api.catalog import supabase
import postgrest

router = APIRouter(prefix="", tags=["suppliers"])

# Identifiant de compagnie par défaut qui fonctionne avec les politiques RLS (anon)
WORKING_COMPANY_ID = "bf907290-a4d0-49d9-9d18-327b074d9747"

class SupplierCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    company_id: str = WORKING_COMPANY_ID

class SupplierUpdate(BaseModel):
    name: str
    description: Optional[str] = ""

class ContactCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company_id: str = WORKING_COMPANY_ID

class ItemLink(BaseModel):
    item_id: str

@router.get("/")
def list_suppliers():
    try:
        response = (
            supabase.postgrest
            .schema("catalog")
            .from_("suppliers")
            .select("*")
            .execute()
        )
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
def create_supplier(payload: SupplierCreate):
    try:
        response = (
            supabase.postgrest
            .schema("catalog")
            .table("suppliers")
            .insert(payload.dict())
            .execute()
        )
        return response.data[0] if response.data else None
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
    except Exception as e:
        if "JSONDecodeError" in str(e) or "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Fournisseur non trouvé")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{supplier_id}")
def update_supplier(supplier_id: str, payload: SupplierUpdate):
    try:
        response = (
            supabase.postgrest.schema("catalog")
            .table("suppliers")
            .update(payload.dict())
            .eq("id", supplier_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Fournisseur non trouvé")
        return response.data[0] if response.data else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: str):
    try:
        response = (
            supabase.postgrest.schema("catalog")
            .table("suppliers")
            .delete()
            .eq("id", supplier_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Fournisseur non trouvé")
        return {"detail": "Fournisseur supprimé avec succès"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{supplier_id}/items")
def list_supplier_items(supplier_id: str):
    try:
        response = (
            supabase.postgrest.schema("catalog")
            .table("item_suppliers")
            .select("*, items(*)")
            .eq("supplier_id", supplier_id)
            .execute()
        )
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{supplier_id}/add-item")
def add_item_to_supplier(supplier_id: str, payload: ItemLink):
    try:
        # Récupérer d'abord le company_id du fournisseur (très important pour le RLS)
        supplier_response = (
            supabase.postgrest.schema("catalog")
            .table("suppliers")
            .select("company_id")
            .eq("id", supplier_id)
            .single()
            .execute()
        )
        
        if not supplier_response.data:
            raise HTTPException(status_code=404, detail="Fournisseur non trouvé")
            
        company_id = supplier_response.data.get("company_id")
        
        data = payload.dict()
        data["supplier_id"] = supplier_id
        data["company_id"] = company_id

        response = (
            supabase.postgrest.schema("catalog")
            .table("item_suppliers")
            .insert(data)
            .execute()
        )
        return response.data[0] if response.data else None
    except postgrest.exceptions.APIError as e:
        raise HTTPException(status_code=400, detail=f"Erreur RLS ou contrainte: {e.message}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{supplier_id}/remove-item/{item_id}")
def remove_item_from_supplier(supplier_id: str, item_id: str):
    try:
        response = (
            supabase.postgrest.schema("catalog")
            .table("item_suppliers")
            .delete()
            .eq("supplier_id", supplier_id)
            .eq("item_id", item_id)
            .execute()
        )
        return {"detail": "Produit retiré du fournisseur avec succès"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{supplier_id}/contacts")
def list_supplier_contacts(supplier_id: str):
    try:
        response = (
            supabase.postgrest.schema("catalog")
            .table("supplier_contacts")
            .select("*")
            .eq("supplier_id", supplier_id)
            .execute()
        )
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{supplier_id}/contacts")
def add_contact_to_supplier(supplier_id: str, payload: ContactCreate):
    try:
        # Récupérer le company_id exact du fournisseur pour respecter la politique RLS
        supplier_response = (
            supabase.postgrest.schema("catalog")
            .table("suppliers")
            .select("company_id")
            .eq("id", supplier_id)
            .single()
            .execute()
        )
        
        if not supplier_response.data:
            raise HTTPException(status_code=404, detail="Fournisseur non trouvé")
        
        company_id = supplier_response.data.get("company_id")
        
        data = payload.dict()
        data.pop("company_id", None)
        data["supplier_id"] = supplier_id
        data["company_id"] = company_id

        response = (
            supabase.postgrest.schema("catalog")
            .table("supplier_contacts")
            .insert(data)
            .execute()
        )
        return response.data[0] if response.data else None
    except postgrest.exceptions.APIError as e:
        # Retourner l'erreur de sécurité proprement au lieu de faire planter le serveur
        raise HTTPException(status_code=400, detail=f"Politique de sécurité (RLS) violée: {e.message}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{supplier_id}/contacts/{contact_id}")
def delete_supplier_contact(supplier_id: str, contact_id: str):
    try:
        response = (
            supabase.postgrest.schema("catalog")
            .table("supplier_contacts")
            .delete()
            .eq("id", contact_id)
            .eq("supplier_id", supplier_id)
            .execute()
        )
        return {"detail": "Contact supprimé avec succès"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))