from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from app.database import supabase
import httpx
import os

router = APIRouter()

AI_ORCHESTRATION_URL = os.getenv("AI_SERVICE_URL", "http://localhost:8000")

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

class LeadEnrich(BaseModel):
    industry: Optional[str] = None
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    company_size: Optional[str] = None
    annual_revenue: Optional[float] = None
    billing_city: Optional[str] = None
    billing_country: Optional[str] = None
    customer_job_title: Optional[str] = None
    twitter_url: Optional[str] = None
    facebook_url: Optional[str] = None

class SegmentCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class CollectRequest(BaseModel):
    keywords: str
    location: Optional[str] = None
    industry: Optional[str] = None
    target_persona: Optional[str] = None
    budget_target: Optional[str] = None
    volume: Optional[int] = 10
    sources: Optional[List[str]] = ["web", "linkedin", "annuaires"]
    quality_vs_quantity: Optional[str] = "quality"
    search_depth: Optional[str] = "standard"
    auto_import: Optional[bool] = False

class CollectImportRequest(BaseModel):
    leads: List[dict]


# ─── POST /leads/collect ───────────────────────────────────────────────────────

@router.post("/collect")
async def collect_leads(request: CollectRequest, company_id: str = Query(...)):
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            res = await client.post(
                f"{AI_ORCHESTRATION_URL}/ai-orchestration/jobs",
                params={"company_id": company_id},
                json={
                    "keywords": request.keywords,
                    "location": request.location,
                    "industry": request.industry,
                    "target_persona": request.target_persona,
                    "budget_target": request.budget_target,
                    "volume": request.volume,
                    "sources": request.sources,
                    "quality_vs_quantity": request.quality_vs_quantity,
                    "search_depth": request.search_depth,
                }
            )
            if not res.is_success:
                raise HTTPException(status_code=res.status_code, detail=f"AI orchestration error: {res.text}")
            ai_response = res.json()

        leads = ai_response.get("data", [])
        total_found = ai_response.get("total", 0)
        sources_analyzed = ai_response.get("sources_analyzed", 0)

        def map_lead(lead: dict) -> dict:
            return {
                "customer_name": lead.get("customer_name"),
                "customer_email": lead.get("customer_email"),
                "customer_phone": lead.get("customer_phone"),
                "company_name": lead.get("company_name"),
                "source": "web_collection",
                "source_details": lead.get("keyword_match", ""),
                "status": "new",
                "score": lead.get("score", 0),
                "rating": lead.get("rating"),
                "priority": lead.get("priority", "medium"),
                "industry": lead.get("industry"),
                "website": lead.get("website"),
                "billing_city": lead.get("billing_city"),
                "billing_country": lead.get("billing_country"),
                "crm_notes": lead.get("justification", ""),
            }

        imported = 0
        errors = []

        if request.auto_import:
            for lead in leads:
                try:
                    mapped = map_lead(lead)
                    supabase.rpc("create_lead", {
                        "p_company_id": company_id,
                        "p_customer_name": mapped.get("customer_name"),
                        "p_customer_email": mapped.get("customer_email"),
                        "p_customer_phone": mapped.get("customer_phone"),
                        "p_customer_phone2": None,
                        "p_customer_job_title": None,
                        "p_company_name": mapped.get("company_name"),
                        "p_source": mapped.get("source"),
                        "p_source_details": mapped.get("source_details"),
                        "p_status": mapped.get("status"),
                        "p_score": mapped.get("score"),
                        "p_rating": mapped.get("rating"),
                        "p_priority": mapped.get("priority"),
                        "p_estimated_value": 0,
                        "p_probability": 0,
                        "p_crm_notes": mapped.get("crm_notes"),
                        "p_next_action": None,
                        "p_industry": mapped.get("industry"),
                        "p_website": mapped.get("website"),
                        "p_linkedin_url": None,
                        "p_company_size": None,
                        "p_billing_city": mapped.get("billing_city"),
                        "p_billing_country": mapped.get("billing_country"),
                    }).execute()
                    imported += 1
                except Exception as e:
                    errors.append(str(e))

        return {
            "success": True,
            "total_found": total_found,
            "sources_analyzed": sources_analyzed,
            "leads": [map_lead(l) for l in leads],
            "imported": imported if request.auto_import else 0,
            "errors": errors,
            "message": f"{total_found} leads collectés" + (f", {imported} importés dans le CRM" if request.auto_import else " — prêts pour validation")
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/collect/import")
async def import_collected_leads(request: CollectImportRequest, company_id: str = Query(...)):
    imported = 0
    errors = []
    for lead in request.leads:
        try:
            supabase.rpc("create_lead", {
                "p_company_id": company_id,
                "p_customer_name": lead.get("customer_name"),
                "p_customer_email": lead.get("customer_email"),
                "p_customer_phone": lead.get("customer_phone"),
                "p_customer_phone2": None,
                "p_customer_job_title": lead.get("customer_job_title"),
                "p_company_name": lead.get("company_name"),
                "p_source": "web_collection",
                "p_source_details": lead.get("keyword_match", ""),
                "p_status": "new",
                "p_score": lead.get("score", 0),
                "p_rating": lead.get("rating"),
                "p_priority": lead.get("priority", "medium"),
                "p_estimated_value": 0,
                "p_probability": 0,
                "p_crm_notes": lead.get("justification", ""),
                "p_next_action": None,
                "p_industry": lead.get("industry"),
                "p_website": lead.get("website"),
                "p_linkedin_url": None,
                "p_company_size": None,
                "p_billing_city": lead.get("billing_city"),
                "p_billing_country": lead.get("billing_country"),
            }).execute()
            imported += 1
        except Exception as e:
            errors.append(f"Failed to import {lead.get('customer_name', 'unknown')}: {str(e)}")

    return {
        "success": True,
        "imported": imported,
        "total": len(request.leads),
        "errors": errors,
        "message": f"{imported}/{len(request.leads)} leads importés dans le CRM!"
    }


# ─── BE-05: POST /leads/{lead_id}/enrich ──────────────────────────────────────

@router.post("/{lead_id}/enrich")
async def enrich_lead(lead_id: str, enrich: LeadEnrich, company_id: str = Query(...)):
    """
    Enrich a lead with additional information.
    Calls the enrich_lead RPC function in Supabase.
    """
    try:
        result = supabase.rpc("enrich_lead", {
            "p_lead_id": lead_id,
            "p_company_id": company_id,
            "p_industry": enrich.industry,
            "p_website": enrich.website,
            "p_linkedin_url": enrich.linkedin_url,
            "p_company_size": enrich.company_size,
            "p_annual_revenue": enrich.annual_revenue,
            "p_billing_city": enrich.billing_city,
            "p_billing_country": enrich.billing_country,
            "p_customer_job_title": enrich.customer_job_title,
            "p_twitter_url": enrich.twitter_url,
            "p_facebook_url": enrich.facebook_url,
        }).execute()
        return {"success": True, "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Existing Endpoints ────────────────────────────────────────────────────────

@router.post("/segments/create")
async def create_segment(segment: SegmentCreate, company_id: str = Query(...)):
    try:
        result = supabase.rpc("create_segment", {
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
        result = supabase.rpc("list_segments", {"p_company_id": company_id}).execute()
        data = result.data
        if data is None:
            segments, total = [], 0
        elif isinstance(data, list):
            if len(data) == 0:
                segments, total = [], 0
            elif isinstance(data[0], dict) and "segments" in data[0]:
                row = data[0]
                segments = row.get("segments", []) if isinstance(row.get("segments"), list) else []
                total = row.get("total", len(segments)) if isinstance(row.get("total"), (int, float)) else len(segments)
            else:
                segments, total = data, len(data)
        else:
            segments, total = [], 0
        return {"success": True, "data": segments, "total": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/segments/{segment_id}")
async def delete_segment(segment_id: str, company_id: str = Query(...)):
    try:
        result = supabase.rpc("delete_segment", {
            "p_segment_id": segment_id,
            "p_company_id": company_id
        }).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/deduplicate")
async def detect_duplicates(company_id: str = Query(...)):
    try:
        result = supabase.rpc("detect_duplicates", {"p_company_id": company_id}).execute()
        return {"success": True, "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/deduplicate/{lead_id}")
async def delete_duplicate(lead_id: str, company_id: str = Query(...)):
    try:
        result = supabase.rpc("delete_lead", {
            "p_lead_id": lead_id,
            "p_company_id": company_id
        }).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_lead(lead: LeadCreate, company_id: str = Query(...)):
    try:
        result = supabase.rpc("create_lead", {
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
        result = supabase.rpc("list_leads", {
            "p_company_id": company_id,
            "p_status": status,
            "p_search": search,
            "p_rating": rating,
            "p_priority": priority,
            "p_limit": limit,
            "p_offset": (page - 1) * limit
        }).execute()
        data = result.data
        if data is None:
            leads, total = [], 0
        elif isinstance(data, list):
            if len(data) == 0:
                leads, total = [], 0
            elif isinstance(data[0], dict) and ("leads" in data[0] or "total" in data[0]):
                row = data[0]
                leads = row.get("leads", []) if isinstance(row.get("leads"), list) else []
                total = row.get("total", len(leads)) if isinstance(row.get("total"), (int, float)) else len(leads)
            else:
                leads, total = data, len(data)
        elif isinstance(data, dict):
            leads = data.get("leads", [])
            total = data.get("total", len(leads) if isinstance(leads, list) else 0)
        else:
            leads, total = [], 0
        return {"success": True, "data": leads, "total": total, "page": page, "limit": limit}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/import/csv")
async def import_csv_placeholder():
    return {"message": "CSV import endpoint"}

@router.post("/import/csv")
async def import_leads_csv(company_id: str = Query(...)):
    return {"success": True, "imported": 0, "message": "CSV import not yet implemented"}

@router.get("/{lead_id}")
async def get_lead(lead_id: str, company_id: str = Query(...)):
    try:
        result = supabase.rpc("get_lead", {
            "p_lead_id": lead_id,
            "p_company_id": company_id
        }).execute()
        return {"success": True, "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/{lead_id}")
async def update_lead(lead_id: str, lead: LeadUpdate, company_id: str = Query(...)):
    try:
        result = supabase.rpc("update_lead", {
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
        result = supabase.rpc("delete_lead", {
            "p_lead_id": lead_id,
            "p_company_id": company_id
        }).execute()
        return {"success": True, "deleted": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))