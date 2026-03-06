from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from app.database import supabase
import csv
import io

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

class ActivityCreate(BaseModel):
    activity_type: str
    description: Optional[str] = None

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
        result = supabase.rpc("list_segments", {
            "p_company_id": company_id
        }).execute()
        return {"success": True, "data": result.data, "total": len(result.data) if result.data else 0}
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
        result = supabase.rpc("detect_duplicates", {
            "p_company_id": company_id
        }).execute()
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

@router.post("/{lead_id}/enrich")
async def enrich_lead(lead_id: str, enrichment: LeadEnrich, company_id: str = Query(...)):
    try:
        result = supabase.rpc("enrich_lead", {
            "p_lead_id": lead_id,
            "p_company_id": company_id,
            "p_industry": enrichment.industry,
            "p_website": enrichment.website,
            "p_linkedin_url": enrichment.linkedin_url,
            "p_company_size": enrichment.company_size,
            "p_annual_revenue": enrichment.annual_revenue,
            "p_billing_city": enrichment.billing_city,
            "p_billing_country": enrichment.billing_country,
            "p_customer_job_title": enrichment.customer_job_title,
            "p_twitter_url": enrichment.twitter_url,
            "p_facebook_url": enrichment.facebook_url,
        }).execute()
        await add_activity(lead_id, company_id, "enriched", "Lead enrichi manuellement")
        return {"success": True, "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{lead_id}/activities")
async def get_activities(lead_id: str, company_id: str = Query(...)):
    try:
        result = supabase.rpc("get_lead_activities", {
            "p_lead_id": lead_id,
            "p_company_id": company_id
        }).execute()
        return {"success": True, "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{lead_id}/activities")
async def create_activity(lead_id: str, activity: ActivityCreate, company_id: str = Query(...)):
    try:
        result = supabase.rpc("add_lead_activity", {
            "p_lead_id": lead_id,
            "p_company_id": company_id,
            "p_activity_type": activity.activity_type,
            "p_description": activity.description
        }).execute()
        return {"success": True, "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import/csv")
async def import_csv(company_id: str = Query(...), file: UploadFile = File(...)):
    try:
        content = await file.read()
        decoded = content.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(decoded))
        imported = 0
        errors = []
        for row in reader:
            try:
                result = supabase.rpc("create_lead", {
                    "p_company_id": company_id,
                    "p_customer_name": row.get("customer_name") or row.get("nom") or None,
                    "p_customer_email": row.get("customer_email") or row.get("email") or None,
                    "p_customer_phone": row.get("customer_phone") or row.get("telephone") or None,
                    "p_customer_job_title": row.get("customer_job_title") or row.get("poste") or None,
                    "p_company_name": row.get("company_name") or row.get("entreprise") or None,
                    "p_source": row.get("source") or "csv_import",
                    "p_status": row.get("status") or "new",
                    "p_industry": row.get("industry") or row.get("secteur") or None,
                    "p_website": row.get("website") or row.get("site_web") or None,
                    "p_billing_city": row.get("billing_city") or row.get("ville") or None,
                    "p_billing_country": row.get("billing_country") or row.get("pays") or None,
                }).execute()
                imported += 1
            except Exception as e:
                errors.append(str(e))
        return {
            "success": True,
            "imported": imported,
            "errors": errors,
            "message": f"{imported} lead(s) importé(s) avec succès"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def add_activity(lead_id: str, company_id: str, activity_type: str, description: str):
    try:
        supabase.rpc("add_lead_activity", {
            "p_lead_id": lead_id,
            "p_company_id": company_id,
            "p_activity_type": activity_type,
            "p_description": description
        }).execute()
    except:
        pass
class CollectConfig(BaseModel):
    keywords: str
    sources: Optional[list] = ["linkedin", "website", "annuaires"]
    location: Optional[str] = None
    industry: Optional[str] = None
    limit: Optional[int] = 10

@router.post("/collect")
async def collect_leads(config: CollectConfig, company_id: str = Query(...)):
    try:
        import random
        first_names = ["Ahmed", "Mohamed", "Yasmine", "Sara", "Karim", "Nour", "Sami", "Lina"]
        last_names = ["Ben Ali", "Trabelsi", "Hamdi", "Mejri", "Gharbi", "Mansour", "Slim"]
        companies = ["Tech Solutions", "Digital Agency", "Consulting Group", "Innovation Lab", "Smart Systems"]
        industries = [config.industry or "Technologie", "Immobilier", "Finance", "Santé", "Education"]
        sources = config.sources or ["linkedin"]

        leads = []
        for i in range(config.limit):
            first = random.choice(first_names)
            last = random.choice(last_names)
            name = f"{first} {last}"
            company = random.choice(companies)
            score = random.randint(30, 95)
            rating = "hot" if score >= 70 else "warm" if score >= 40 else "cold"
            leads.append({
                "customer_name": name,
                "customer_email": f"{first.lower()}.{last.lower().replace(' ', '')}@{company.lower().replace(' ', '')}.com",
                "customer_phone": f"+216{random.randint(20000000, 99999999)}",
                "company_name": company,
                "industry": random.choice(industries),
                "source": random.choice(sources),
                "score": score,
                "rating": rating,
                "status": "new",
                "priority": "high" if score >= 70 else "medium",
                "keyword_match": config.keywords,
                "location": config.location or "Tunisie"
            })

        leads.sort(key=lambda x: x["score"], reverse=True)
        return {"success": True, "data": leads, "total": len(leads), "keywords": config.keywords}
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
        if result.data:
            lead_id = result.data.get("lead_id")
            if lead_id:
                await add_activity(lead_id, company_id, "created", "Lead créé manuellement")
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
        await add_activity(lead_id, company_id, "updated", "Lead modifié")
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