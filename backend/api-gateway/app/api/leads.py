from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from app.database import get_supabase

router = APIRouter()

class LeadCreate(BaseModel):
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_phone2: Optional[str] = None
    customer_job_title: Optional[str] = None
    company_name: Optional[str] = None
    source: Optional[str] = "manual"
    source_details: Optional[str] = None
    status: Optional[str] = "new"
    score: Optional[int] = 0
    rating: Optional[str] = None
    priority: Optional[str] = "medium"
    estimated_value: Optional[float] = 0
    estimated_close_date: Optional[str] = None
    probability: Optional[int] = 0
    crm_notes: Optional[str] = None
    next_action: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    company_size: Optional[str] = None
    billing_city: Optional[str] = None
    billing_country: Optional[str] = None

class LeadUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_job_title: Optional[str] = None
    company_name: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    score: Optional[int] = None
    rating: Optional[str] = None
    priority: Optional[str] = None
    estimated_value: Optional[float] = None
    probability: Optional[int] = None
    crm_notes: Optional[str] = None
    next_action: Optional[str] = None
    lost_reason: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    company_size: Optional[str] = None

class SegmentCreate(BaseModel):
    name: str
    description: Optional[str] = ""

@router.post("/segments/create")
async def create_segment(segment: SegmentCreate, company_id: str = Query(...)):
    try:
        result = get_supabase().rpc("create_segment", {
            "p_company_id": company_id,
            "p_name": segment.name,
            "p_description": segment.description
        }).execute()
        return {"success": True, "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/segments/list")
async def list_segments(company_id: str = Query(...)):
    try:
        result = get_supabase().rpc("list_segments", {
            "p_company_id": company_id
        }).execute()
        return {"success": True, "data": result.data, "total": len(result.data) if result.data else 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/segments/{segment_id}")
async def delete_segment(segment_id: str, company_id: str = Query(...)):
    try:
        result = get_supabase().rpc("delete_segment", {
            "p_segment_id": segment_id,
            "p_company_id": company_id
        }).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/deduplicate")
async def detect_duplicates(company_id: str = Query(...)):
    try:
        result = get_supabase().rpc("detect_duplicates", {
            "p_company_id": company_id
        }).execute()
        return {"success": True, "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/deduplicate/{lead_id}")
async def delete_duplicate(lead_id: str, company_id: str = Query(...)):
    try:
        result = get_supabase().rpc("delete_lead", {
            "p_lead_id": lead_id,
            "p_company_id": company_id
        }).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_lead(lead: LeadCreate, company_id: str = Query(...)):
    try:
        result = get_supabase().rpc("create_lead", {
            "p_company_id": company_id,
            "p_customer_name": lead.customer_name,
            "p_customer_email": lead.customer_email,
            "p_customer_phone": lead.customer_phone,
            "p_customer_phone2": lead.customer_phone2,
            "p_customer_job_title": lead.customer_job_title,
            "p_company_name": lead.company_name,
            "p_source": lead.source,
            "p_source_details": lead.source_details,
            "p_status": lead.status,
            "p_score": lead.score,
            "p_rating": lead.rating,
            "p_priority": lead.priority,
            "p_estimated_value": lead.estimated_value,
            "p_probability": lead.probability,
            "p_crm_notes": lead.crm_notes,
            "p_next_action": lead.next_action,
            "p_industry": lead.industry,
            "p_website": lead.website,
            "p_linkedin_url": lead.linkedin_url,
            "p_company_size": lead.company_size,
            "p_billing_city": lead.billing_city,
            "p_billing_country": lead.billing_country,
        }).execute()
        return {"success": True, "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def list_leads(
    company_id: str = Query(...),
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
    search: Optional[str] = None,
    rating: Optional[str] = None,
    priority: Optional[str] = None
):
    try:
        result = get_supabase().rpc("list_leads", {
            "p_company_id": company_id,
            "p_status": status,
            "p_search": search,
            "p_rating": rating,
            "p_priority": priority,
            "p_limit": limit,
            "p_offset": (page - 1) * limit
        }).execute()
        return {
            "success": True,
            "data": result.data.get("leads", []),
            "total": result.data.get("total", 0),
            "page": page,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{lead_id}")
async def get_lead(lead_id: str, company_id: str = Query(...)):
    try:
        result = get_supabase().rpc("get_lead", {
            "p_lead_id": lead_id,
            "p_company_id": company_id
        }).execute()
        return {"success": True, "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/{lead_id}")
async def update_lead(lead_id: str, lead: LeadUpdate, company_id: str = Query(...)):
    try:
        result = get_supabase().rpc("update_lead", {
            "p_lead_id": lead_id,
            "p_company_id": company_id,
            "p_customer_name": lead.customer_name,
            "p_customer_email": lead.customer_email,
            "p_customer_phone": lead.customer_phone,
            "p_customer_job_title": lead.customer_job_title,
            "p_company_name": lead.company_name,
            "p_source": lead.source,
            "p_status": lead.status,
            "p_score": lead.score,
            "p_rating": lead.rating,
            "p_priority": lead.priority,
            "p_estimated_value": lead.estimated_value,
            "p_probability": lead.probability,
            "p_crm_notes": lead.crm_notes,
            "p_next_action": lead.next_action,
            "p_lost_reason": lead.lost_reason,
            "p_industry": lead.industry,
            "p_website": lead.website,
            "p_linkedin_url": lead.linkedin_url,
            "p_company_size": lead.company_size,
        }).execute()
        return {"success": True, "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{lead_id}")
async def delete_lead(lead_id: str, company_id: str = Query(...)):
    try:
        result = get_supabase().rpc("delete_lead", {
            "p_lead_id": lead_id,
            "p_company_id": company_id
        }).execute()
        return {"success": True, "deleted": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))