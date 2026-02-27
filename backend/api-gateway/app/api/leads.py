"""Endpoints Leads - à connecter avec Supabase."""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, EmailStr
from typing import Optional
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

@router.post("/deduplicate")
async def deduplicate_leads(threshold: float = 0.8):
    """
    BE-06: Detect and merge duplicate leads
    """
    mock_duplicates = [
        {
            "group_id": "dup1",
            "leads": [
                {
                    "id": "1",
                    "email": "john.doe@company.com",
                    "first_name": "John",
                    "last_name": "Doe",
                    "company": "Tech Solutions",
                    "similarity": 0.95
                },
                {
                    "id": "4", 
                    "email": "john.d@company.com",
                    "first_name": "J.",
                    "last_name": "Doe",
                    "company": "Tech Solutions Inc",
                    "similarity": 0.92
                }
            ],
            "master_lead_id": "1",
            "merged_fields": {
                "email": "john.doe@company.com",
                "phone": "+33612345678",
                "company": "Tech Solutions"
            }
        },
        {
            "group_id": "dup2",
            "leads": [
                {
                    "id": "2",
                    "email": "jane.smith@company.com",
                    "first_name": "Jane",
                    "last_name": "Smith",
                    "company": "Marketing Pro",
                    "similarity": 0.98
                },
                {
                    "id": "5",
                    "email": "j.smith@company.com",
                    "first_name": "Jane",
                    "last_name": "Smith",
                    "company": "Marketing Pro LLC",
                    "similarity": 0.94
                }
            ],
            "master_lead_id": "2",
            "merged_fields": {
                "email": "jane.smith@company.com",
                "phone": "+33687654321",
                "company": "Marketing Pro"
            }
        }
    ]
    
    filtered_duplicates = []
    for group in mock_duplicates:
        avg_similarity = sum(l["similarity"] for l in group["leads"]) / len(group["leads"])
        if avg_similarity >= threshold:
            filtered_duplicates.append(group)
    
    return {
        "success": True,
        "threshold": threshold,
        "duplicate_groups_found": len(filtered_duplicates),
        "total_leads_affected": sum(len(g["leads"]) for g in filtered_duplicates),
        "duplicate_groups": filtered_duplicates,
        "suggested_merges": [
            {
                "group_id": g["group_id"],
                "keep_lead_id": g["master_lead_id"],
                "merge_lead_ids": [l["id"] for l in g["leads"] if l["id"] != g["master_lead_id"]]
            }
            for g in filtered_duplicates
        ]
    }

@router.post("/segments")
async def create_segment(
    rules: dict,
    name: str = Query(...),
    description: str = Query(...)
):
    """
    BE-07: Create a new segment
    """
    segment_id = f"seg_{random.randint(1000, 9999)}"
    
    return {
        "success": True,
        "data": {
            "id": segment_id,
            "name": name,
            "description": description,
            "rules": rules,
            "lead_count": random.randint(50, 500),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
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

@router.get("/segments")
async def list_segments():
    """
    BE-08: List all segments
    """
    mock_segments = [
        {
            "id": "seg_1001",
            "name": "High Value Prospects",
            "description": "Leads with score > 80 and budget > 50k",
            "lead_count": 156,
            "created_at": "2026-02-20T10:00:00"
        },
        {
            "id": "seg_1002",
            "name": "Tech Decision Makers",
            "description": "CTOs, VPs of Engineering in tech sector",
            "lead_count": 89,
            "created_at": "2026-02-21T14:30:00"
        },
        {
            "id": "seg_1003",
            "name": "Recent Engagement",
            "description": "Opened emails or clicked in last 7 days",
            "lead_count": 234,
            "created_at": "2026-02-22T09:15:00"
        },
        {
            "id": "seg_1004",
            "name": "Need Enrichment",
            "description": "Leads missing phone or email",
            "lead_count": 67,
            "created_at": "2026-02-23T16:45:00"
        }
    ]
    
    return {
        "success": True,
        "total": len(mock_segments),
        "data": mock_segments
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