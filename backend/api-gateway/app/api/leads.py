"""Endpoints Leads - à connecter avec Supabase."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
import random
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

@router.post("/collect")
async def collect_leads(source: str, query: str, limit: int = 10):
    """
    BE-04: Collect leads from web with IA
    """
    mock_collected_leads = []
    
    for i in range(limit):
        mock_collected_leads.append({
            "id": f"c{i+1}",
            "email": f"contact{random.randint(1,999)}@company{random.randint(1,100)}.com",
            "first_name": "Collected",
            "last_name": f"Lead{random.randint(1,100)}",
            "company_name": f"Business {random.randint(1,50)}",
            "position": random.choice(["CEO", "CTO", "Manager", "Director", "Founder"]),
            "source": source,
            "query": query,
            "confidence_score": random.randint(60, 99),
            "collected_at": datetime.now().isoformat()
        })
    
    return {
        "success": True,
        "source": source,
        "query": query,
        "total_collected": len(mock_collected_leads),
        "data": mock_collected_leads
    }

@router.post("/{lead_id}/enrich")
async def enrich_lead(lead_id: str):
    """
    BE-05: Enrich a lead with external data
    """
    mock_enriched_data = {
        "id": lead_id,
        "enriched_email": f"verified.{random.choice(['work', 'personal'])}@domain.com",
        "enriched_phone": f"+33{random.randint(600000000, 799999999)}",
        "company_siret": f"{random.randint(100000000, 999999999)}{random.randint(100000, 999999)}",
        "company_size": random.choice(["1-10", "11-50", "51-200", "201-1000", "1000+"]),
        "company_sector": random.choice(["Tech", "Finance", "Healthcare", "Retail", "Manufacturing"]),
        "social_profiles": {
            "linkedin": f"https://linkedin.com/in/lead-{lead_id}",
            "twitter": f"https://twitter.com/lead_{lead_id}"
        },
        "confidence_score": random.randint(75, 98),
        "enriched_at": datetime.now().isoformat()
    }
    
    return {
        "success": True,
        "lead_id": lead_id,
        "enriched_data": mock_enriched_data
    }

@router.get("/{lead_id}")
async def get_lead(lead_id: str):
    """
    BE-03: Get a single lead by ID
    """
    mock_leads = {
        "1": {
            "id": "1",
            "email": "john.doe@company.com",
            "first_name": "John",
            "last_name": "Doe",
            "status": "new",
            "score": 85,
            "created_at": "2026-02-24T10:00:00"
        },
        "2": {
            "id": "2",
            "email": "jane.smith@company.com",
            "first_name": "Jane",
            "last_name": "Smith",
            "status": "contacted",
            "score": 92,
            "created_at": "2026-02-24T11:00:00"
        },
        "3": {
            "id": "3",
            "email": "ahmed.benzema@company.com",
            "first_name": "Ahmed",
            "last_name": "Benzema",
            "status": "qualified",
            "score": 78,
            "created_at": "2026-02-24T12:00:00"
        }
    }
    
    lead = mock_leads.get(lead_id)
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return {
        "success": True,
        "data": lead
    }

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