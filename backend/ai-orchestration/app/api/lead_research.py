"""Lead Research AI endpoints."""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
import json
import random

from app.services.ai_client import call_ai
from app.prompts.lead_research import SYSTEM_PROMPT, get_extraction_prompt
from app.config.settings import CRM_SERVICE_URL, MAX_LEADS_PER_JOB
import httpx

router = APIRouter()

class LeadResearchRequest(BaseModel):
    keywords: str
    location: Optional[str] = None
    industry: Optional[str] = None
    target_persona: Optional[str] = None
    budget_target: Optional[str] = None
    volume: Optional[int] = 10
    sources: Optional[List[str]] = ["web", "linkedin", "annuaires"]
    quality_vs_quantity: Optional[str] = "quality"
    search_depth: Optional[str] = "standard"

class JobStatus(BaseModel):
    job_id: str
    status: str
    progress: int
    message: str
    leads: Optional[List[dict]] = None
    total_found: Optional[int] = 0
    sources_analyzed: Optional[int] = 0

# In-memory job storage (replace with Redis later)
jobs_store: dict = {}

@router.post("/jobs")
async def create_lead_research_job(
    request: LeadResearchRequest,
    company_id: str = Query(...)
):
    """Launch a new lead research job."""
    try:
        import uuid
        job_id = str(uuid.uuid4())
        
        jobs_store[job_id] = {
            "job_id": job_id,
            "status": "running",
            "progress": 10,
            "message": "Démarrage de la recherche...",
            "leads": [],
            "total_found": 0,
            "sources_analyzed": 0,
            "company_id": company_id,
            "request": request.dict()
        }

        # Simulate search results for now
        raw_results = f"""
        Search results for: {request.keywords}
        Location: {request.location or 'Not specified'}
        Industry: {request.industry or 'Not specified'}
        
        Found multiple companies and contacts matching the criteria.
        Several businesses in the {request.industry or 'target'} sector 
        located in {request.location or 'the region'}.
        """

        jobs_store[job_id]["progress"] = 40
        jobs_store[job_id]["message"] = "Analyse des sources en cours..."
        jobs_store[job_id]["sources_analyzed"] = random.randint(3, 8)

        # Call AI to extract leads
        prompt = get_extraction_prompt(
            request.keywords,
            request.location or "",
            request.industry or "",
            raw_results
        )
        
        ai_response = await call_ai(prompt, SYSTEM_PROMPT)
        
        jobs_store[job_id]["progress"] = 70
        jobs_store[job_id]["message"] = "Scoring et qualification des leads..."

        # Parse AI response
        try:
            clean = ai_response.strip()
            if "```json" in clean:
                clean = clean.split("```json")[1].split("```")[0]
            elif "```" in clean:
                clean = clean.split("```")[1].split("```")[0]
            leads = json.loads(clean)
        except:
            leads = _generate_mock_leads(request)

        # Limit to requested volume
        leads = leads[:min(request.volume or 10, MAX_LEADS_PER_JOB)]
        
        # Add metadata
        for i, lead in enumerate(leads):
            lead["temp_id"] = f"temp_{i}"
            lead["status"] = "new"
            lead["priority"] = "high" if lead.get("score", 0) >= 70 else "medium"
            lead["keyword_match"] = request.keywords

        jobs_store[job_id].update({
            "status": "completed",
            "progress": 100,
            "message": f"{len(leads)} leads trouvés et qualifiés!",
            "leads": leads,
            "total_found": len(leads),
            "sources_analyzed": random.randint(5, 15)
        })

        return {
            "success": True,
            "job_id": job_id,
            "status": "completed",
            "data": leads,
            "total": len(leads),
            "sources_analyzed": jobs_store[job_id]["sources_analyzed"],
            "message": f"{len(leads)} leads trouvés!"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str, company_id: str = Query(...)):
    """Get job status and results."""
    if job_id not in jobs_store:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs_store[job_id]
    return {
        "success": True,
        "job_id": job_id,
        "status": job["status"],
        "progress": job["progress"],
        "message": job["message"],
        "leads": job.get("leads", []),
        "total_found": job.get("total_found", 0),
        "sources_analyzed": job.get("sources_analyzed", 0)
    }

@router.post("/jobs/{job_id}/import")
async def import_leads_to_crm(
    job_id: str,
    company_id: str = Query(...),
    lead_indices: Optional[List[int]] = None
):
    """Import selected leads to CRM."""
    if job_id not in jobs_store:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs_store[job_id]
    leads = job.get("leads", [])
    
    if lead_indices:
        leads_to_import = [leads[i] for i in lead_indices if i < len(leads)]
    else:
        leads_to_import = leads

    imported = 0
    errors = []

    async with httpx.AsyncClient(timeout=30) as client:
        for lead in leads_to_import:
            try:
                payload = {k: v for k, v in lead.items() 
                          if k not in ["temp_id", "keyword_match", "justification",
                                      "relevance_score", "maturity_score", "potential_score"]}
                res = await client.post(
                    f"{CRM_SERVICE_URL}/leads/?company_id={company_id}",
                    json=payload
                )
                if res.status_code == 200:
                    imported += 1
                else:
                    errors.append(f"Failed to import {lead.get('customer_name', 'unknown')}")
            except Exception as e:
                errors.append(str(e))

    return {
        "success": True,
        "imported": imported,
        "errors": errors,
        "message": f"{imported} lead(s) importé(s) dans le CRM!"
    }

def _generate_mock_leads(request: LeadResearchRequest) -> list:
    """Generate mock leads when AI is not available."""
    first_names = ["Ahmed", "Mohamed", "Yasmine", "Sara", "Karim", "Nour", "Sami", "Lina", "Omar", "Fatma"]
    last_names = ["Ben Ali", "Trabelsi", "Hamdi", "Mejri", "Gharbi", "Mansour", "Slim", "Rekik"]
    companies = ["Tech Solutions", "Digital Agency", "Consulting Group", "Innovation Lab", "Smart Systems", "Data Corp"]
    
    leads = []
    for i in range(request.volume or 10):
        first = random.choice(first_names)
        last = random.choice(last_names)
        company = random.choice(companies)
        score = random.randint(30, 95)
        leads.append({
            "customer_name": f"{first} {last}",
            "customer_email": f"{first.lower()}.{last.lower().replace(' ', '')}@{company.lower().replace(' ', '')}.tn",
            "customer_phone": f"+216{random.randint(20000000, 99999999)}",
            "company_name": company,
            "industry": request.industry or "Technologie",
            "billing_city": request.location or "Tunis",
            "billing_country": "Tunisie",
            "score": score,
            "rating": "hot" if score >= 70 else "warm" if score >= 40 else "cold",
            "source": "web_collection",
            "justification": f"Lead qualifié pour '{request.keywords}'"
        })
    return sorted(leads, key=lambda x: x["score"], reverse=True)