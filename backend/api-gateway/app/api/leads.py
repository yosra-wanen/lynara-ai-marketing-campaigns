"""Endpoints Leads - à connecter avec Supabase."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

router = APIRouter()

class LeadCreate(BaseModel):
    email: EmailStr
    phone: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_name: Optional[str] = None
    position: Optional[str] = None
    source: str = "manual"

@router.post("/")
async def create_lead(lead: LeadCreate):
    try:
        return {
            "success": True,
            "data": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "email": lead.email,
                "phone": lead.phone,
                "first_name": lead.first_name,
                "last_name": lead.last_name,
                "company_name": lead.company_name,
                "position": lead.position,
                "source": lead.source,
                "company_id": "11111111-1111-1111-1111-111111111111",
                "status": "new",
                "score": 0,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def findAll():
    return {
        "data": [],
        "message": "Leads endpoint - à connecter avec Supabase",
    }