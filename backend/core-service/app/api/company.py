from fastapi import APIRouter, HTTPException, Query
from supabase import create_client
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="", tags=["company"])

SUPABASE_URL = "https://jwkjqowuponrqmxwhgsj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2pxb3d1cG9ucnFteHdoZ3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNzcxMTQsImV4cCI6MjA4Njc1MzExNH0.lkVrhdwCN321rZk_s5DtUMlrxSMf8ilAU5gPce7emBg"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

#creation entreprise
class CompanyCreate(BaseModel):
    legal_name: str
    industry: str | None = None
    email: str | None = None
    phone: str | None = None
    country: str | None = None
    user_id: str | None = None

@router.post("/create")
def create_company(body: CompanyCreate):
    try:
        # Adaptation au schéma DB réel vérifié
        company_data = {
            "legal_name": body.legal_name,
            "industry": body.industry,
            "email": body.email,
            "phone": body.phone,
            "country": body.country,
            "is_active": True,
            "settings": {} # Initialisation vide pour éviter les erreurs
        }
        
        response = (
            supabase.postgrest
            .schema("core")
            .table("companies")
            .insert(company_data)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=400, detail="Echec de l'insertion")
            
        new_company = response.data[0]
        company_id = new_company.get("id") or new_company.get("company_id")
        
        if body.user_id and company_id:
            try:
                supabase.postgrest.schema("core").table("company_members").insert({
                    "company_id": company_id,
                    "user_id": body.user_id,
                    "role": "owner"
                }).execute()
            except Exception as member_err:
                print(f"Error adding user to company_members: {str(member_err)}")
                
        return new_company

    except Exception as e:
        print(f"Error creating company: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
