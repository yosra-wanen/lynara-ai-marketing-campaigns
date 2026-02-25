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
async def list_leads(
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
    search: Optional[str] = None
):
    mock_leads = [
        {
            "id": "1",
            "email": "john.doe@company.com",
            "first_name": "John",
            "last_name": "Doe",
            "status": "new",
            "score": 85,
            "created_at": "2026-02-24T10:00:00"
        },
        {
            "id": "2",
            "email": "jane.smith@company.com",
            "first_name": "Jane",
            "last_name": "Smith",
            "status": "contacted",
            "score": 92,
            "created_at": "2026-02-24T11:00:00"
        },
        {
            "id": "3",
            "email": "ahmed.benzema@company.com",
            "first_name": "Ahmed",
            "last_name": "Benzema",
            "status": "qualified",
            "score": 78,
            "created_at": "2026-02-24T12:00:00"
        }
    ]
    
    if status:
        mock_leads = [l for l in mock_leads if l["status"] == status]
    
    if search:
        search_lower = search.lower()
        mock_leads = [
            l for l in mock_leads 
            if search_lower in l["email"].lower() 
            or (l["first_name"] and search_lower in l["first_name"].lower())
            or (l["last_name"] and search_lower in l["last_name"].lower())
        ]
    
    start = (page - 1) * limit
    end = start + limit
    paginated_leads = mock_leads[start:end]
    
    return {
        "success": True,
        "data": paginated_leads,
        "page": page,
        "limit": limit,
        "total": len(mock_leads),
        "total_pages": (len(mock_leads) + limit - 1) // limit
    }