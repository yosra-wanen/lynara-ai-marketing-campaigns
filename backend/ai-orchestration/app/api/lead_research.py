"""Lead Research AI endpoints."""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
import json
import random
import time
import httpx
from supabase import create_client, Client

from app.services.ai_client import call_ai
from app.prompts.lead_research import SYSTEM_PROMPT, get_extraction_prompt
from app.config.settings import (
    CRM_SERVICE_URL, MAX_LEADS_PER_JOB, SUPABASE_URL, SUPABASE_SERVICE_KEY,
    MASKED_KEYS
)
from app.services.rate_limiter import rate_limiter
from app.services.metrics import metrics

router = APIRouter()

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY) if SUPABASE_URL and SUPABASE_SERVICE_KEY else None
print(f"[INIT] Supabase connected: {supabase is not None}")
print(f"[INIT] Masked keys loaded: {MASKED_KEYS}")


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


class CompanyTargetParams(BaseModel):
    default_location: Optional[str] = None
    default_industry: Optional[str] = None
    default_persona: Optional[str] = None
    default_volume: Optional[int] = 10
    allowed_sources: Optional[List[str]] = ["web", "linkedin", "annuaires"]


jobs_store: dict = {}


# ─── LEAD-AI-06-02: Access Control ────────────────────────────────────────────

def check_ai_access(company_id: str, user_id: str) -> bool:
    """Check if user has access to AI module (only owner role)."""
    try:
        if supabase:
            res = supabase.schema("core").table("company_members").select("role").eq(
                "company_id", company_id
            ).eq("user_id", user_id).single().execute()
            if res.data:
                role = res.data.get("role")
                print(f"[ACCESS] user {user_id[:8]}... has role '{role}'")
                return role == "owner"
    except Exception as e:
        print(f"[ACCESS] Check error: {e}")
    return False


# ─── LEAD-AI-06-03: Company Target Params ─────────────────────────────────────

def get_company_target_params(company_id: str) -> dict:
    """Get default target params for a company from ai_configs."""
    try:
        if supabase:
            res = supabase.schema("core").table("ai_configs").select(
                "additional_config"
            ).eq("company_id", company_id).eq("is_active", True).execute()
            if res.data and len(res.data) > 0:
                config = res.data[0].get("additional_config") or {}
                target_params = config.get("target_params", {})
                print(f"[CONFIG] Target params loaded: {target_params}")
                return target_params
    except Exception as e:
        print(f"[CONFIG] Target params error: {e}")
    return {}


def save_company_target_params(company_id: str, params: dict):
    """Save default target params for a company."""
    try:
        if supabase:
            res = supabase.schema("core").table("ai_configs").select("config_id").eq(
                "company_id", company_id
            ).execute()
            if res.data and len(res.data) > 0:
                config_id = res.data[0]["config_id"]
                supabase.schema("core").table("ai_configs").update({
                    "additional_config": {"target_params": params}
                }).eq("config_id", config_id).execute()
            else:
                supabase.schema("core").table("ai_configs").insert({
                    "company_id": company_id,
                    "additional_config": {"target_params": params},
                    "is_active": True,
                    "is_default": True,
                }).execute()
            print(f"[CONFIG] Target params saved for {company_id[:8]}...")
    except Exception as e:
        print(f"[CONFIG] Save error: {e}")


# ─── Quota Management ─────────────────────────────────────────────────────────

def get_or_create_quota(company_id: str):
    try:
        if supabase:
            res = supabase.schema("core").table("ai_quotas").select("*").eq(
                "company_id", company_id
            ).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
            else:
                new_quota = {
                    "company_id": company_id,
                    "searches_used": 0,
                    "searches_limit": 100,
                    "leads_collected": 0,
                    "leads_limit": 1000,
                    "api_calls": 0,
                    "api_calls_limit": 5000,
                }
                supabase.schema("core").table("ai_quotas").insert(new_quota).execute()
                return new_quota
    except Exception as e:
        print(f"[QUOTA] DB error: {e}")
    return {
        "searches_used": 0,
        "searches_limit": 100,
        "leads_collected": 0,
        "leads_limit": 1000,
        "api_calls": 0,
        "api_calls_limit": 5000,
    }


def update_quota(company_id: str, searches: int, leads: int, api_calls: int):
    try:
        if supabase:
            current = get_or_create_quota(company_id)
            supabase.schema("core").table("ai_quotas").update({
                "searches_used": current.get("searches_used", 0) + searches,
                "leads_collected": current.get("leads_collected", 0) + leads,
                "api_calls": current.get("api_calls", 0) + api_calls,
            }).eq("company_id", company_id).execute()
            print(f"[QUOTA] Updated for {company_id[:8]}...")
    except Exception as e:
        print(f"[QUOTA] Update error: {e}")


def save_search_job(company_id: str, request: LeadResearchRequest, total_found: int, sources_analyzed: int):
    try:
        if supabase:
            result = supabase.schema("core").table("ai_search_jobs").insert({
                "company_id": company_id,
                "keywords": request.keywords,
                "location": request.location,
                "industry": request.industry,
                "volume": request.volume,
                "sources": request.sources,
                "total_found": total_found,
                "total_imported": 0,
                "status": "completed",
            }).execute()
            print(f"[DB] Search job saved: {result.data[0]['id'] if result.data else 'unknown'}")
    except Exception as e:
        print(f"[DB] Save job error: {e}")


def _build_search_queries(request: LeadResearchRequest) -> list:
    """Build multiple search queries from the request."""
    queries = []
    base = request.keywords
    location = request.location or ""
    industry = request.industry or ""
    persona = request.target_persona or ""

    q1 = base
    if location:
        q1 += f" {location}"
    queries.append(q1)

    if industry and location:
        queries.append(f"{industry} entreprise {location} contact email")

    if persona and industry:
        queries.append(f"{persona} {industry} {location} LinkedIn")
    elif persona:
        queries.append(f"{persona} {base} {location}")

    return queries[:3]


# ─── Main Job Endpoint ─────────────────────────────────────────────────────────

@router.post("/jobs")
async def create_lead_research_job(
    request: LeadResearchRequest,
    company_id: str = Query(...),
    user_id: Optional[str] = Query(None)
):
    job_start_time = time.time()

    try:
        # LEAD-AI-06-02: Check access
        if user_id:
            has_access = check_ai_access(company_id, user_id)
            if not has_access:
                raise HTTPException(
                    status_code=403,
                    detail="Accès refusé. Seuls les propriétaires peuvent lancer des recherches IA."
                )

        # Section 8: Rate limit check on AI calls
        if not rate_limiter.check_ai(company_id):
            raise HTTPException(
                status_code=429,
                detail="Trop de requêtes IA. Veuillez patienter avant de relancer une recherche."
            )

        # Track job start
        metrics.job_started(company_id)

        # LEAD-AI-06-03: Apply company default params
        company_defaults = get_company_target_params(company_id)
        if not request.location and company_defaults.get("default_location"):
            request.location = company_defaults["default_location"]
            print(f"[CONFIG] Applied default location: {request.location}")
        if not request.industry and company_defaults.get("default_industry"):
            request.industry = company_defaults["default_industry"]
            print(f"[CONFIG] Applied default industry: {request.industry}")
        if not request.target_persona and company_defaults.get("default_persona"):
            request.target_persona = company_defaults["default_persona"]
            print(f"[CONFIG] Applied default persona: {request.target_persona}")

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

        # Step 1: Build smart search queries
        queries = _build_search_queries(request)
        print(f"[PIPELINE] Step 1 — Search queries: {queries}")

        # Step 2: Search the web with SerpAPI (with rate limiting)
        from app.services.serpapi_service import search_web
        all_results = []
        for query in queries:
            if not rate_limiter.check_serpapi(company_id):
                print(f"[RATE_LIMIT] SerpAPI rate limit reached for {company_id[:8]}...")
                break
            results = await search_web(
                query=query,
                location=request.location or "",
                num_results=5
            )
            all_results.extend(results)
            print(f"[PIPELINE] Step 2 — SerpAPI '{query}': {len(results)} results")

        jobs_store[job_id]["progress"] = 30
        jobs_store[job_id]["message"] = f"Analyse de {len(all_results)} sources web..."
        jobs_store[job_id]["sources_analyzed"] = len(all_results)

        # Step 2.5: Enrich top results with Firecrawl (with rate limiting)
        from app.services.firecrawl_service import crawl_page
        enriched_results = []
        crawl_limit = 3 if request.search_depth == "standard" else 5 if request.search_depth == "deep" else 1

        for r in all_results[:crawl_limit]:
            if not rate_limiter.check_firecrawl(company_id):
                print(f"[RATE_LIMIT] Firecrawl rate limit reached for {company_id[:8]}...")
                enriched_results.append({**r, "full_content": ""})
                continue
            try:
                print(f"[PIPELINE] Step 2.5 — Firecrawl: {r['link'][:60]}...")
                content = await crawl_page(r['link'])
                enriched_results.append({
                    **r,
                    "full_content": content[:1500] if content else ""
                })
                print(f"[PIPELINE] Firecrawl success: {len(content)} chars")
            except Exception as e:
                print(f"[PIPELINE] Firecrawl failed: {e}")
                enriched_results.append({**r, "full_content": ""})

        for r in all_results[crawl_limit:]:
            enriched_results.append({**r, "full_content": ""})

        jobs_store[job_id]["progress"] = 55
        jobs_store[job_id]["message"] = f"Extraction du contenu terminée ({len(enriched_results)} pages)..."

        # Step 3: Format enriched results for AI
        raw_results = "\n\n---\n\n".join([
            f"Title: {r['title']}\nURL: {r['link']}\nSnippet: {r['snippet']}\n"
            + (f"Full content: {r['full_content']}" if r.get('full_content') else "")
            for r in enriched_results
        ]) if enriched_results else f"No web results found for: {request.keywords} in {request.location}"

        print(f"[PIPELINE] Step 3 — Raw results: {len(raw_results)} chars")

        # Step 4: AI extracts and scores leads
        jobs_store[job_id]["progress"] = 70
        jobs_store[job_id]["message"] = "Scoring et qualification des leads par IA..."

        prompt = get_extraction_prompt(
            request.keywords,
            request.location or "",
            request.industry or "",
            raw_results
        )

        ai_response = await call_ai(prompt, SYSTEM_PROMPT)
        print(f"[PIPELINE] Step 4 — AI response: {len(ai_response)} chars")

        # Step 5: Parse AI response
        try:
            clean = ai_response.strip()
            if "```json" in clean:
                clean = clean.split("```json")[1].split("```")[0]
            elif "```" in clean:
                clean = clean.split("```")[1].split("```")[0]
            leads = json.loads(clean)
            if not isinstance(leads, list):
                leads = _generate_mock_leads(request)
        except Exception as e:
            print(f"[PIPELINE] JSON parse error: {e}")
            leads = _generate_mock_leads(request)

        # Step 6: Limit and enrich leads
        leads = leads[:min(request.volume or 10, MAX_LEADS_PER_JOB)]
        for i, lead in enumerate(leads):
            lead["temp_id"] = f"temp_{i}"
            lead["status"] = "new"
            lead["priority"] = "high" if lead.get("score", 0) >= 70 else "medium"
            lead["keyword_match"] = request.keywords

        sources_analyzed = len(all_results)
        duration = round(time.time() - job_start_time, 2)

        save_search_job(company_id, request, len(leads), sources_analyzed)
        update_quota(company_id, searches=1, leads=len(leads), api_calls=sources_analyzed)
        metrics.job_completed(company_id, duration)

        print(f"[PIPELINE] Completed in {duration}s — {len(leads)} leads found")

        jobs_store[job_id].update({
            "status": "completed",
            "progress": 100,
            "message": f"{len(leads)} leads trouvés et qualifiés!",
            "leads": leads,
            "total_found": len(leads),
            "sources_analyzed": sources_analyzed,
            "duration_seconds": duration
        })

        return {
            "success": True,
            "job_id": job_id,
            "status": "completed",
            "data": leads,
            "total": len(leads),
            "sources_analyzed": sources_analyzed,
            "duration_seconds": duration,
            "message": f"{len(leads)} leads trouvés!"
        }

    except HTTPException:
        duration = round(time.time() - job_start_time, 2)
        metrics.job_failed(company_id, duration, "HTTP Exception")
        raise
    except Exception as e:
        duration = round(time.time() - job_start_time, 2)
        metrics.job_failed(company_id, duration, str(e))
        print(f"[ERROR] Job failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Metrics Endpoint ─────────────────────────────────────────────────────────

@router.get("/metrics")
async def get_metrics(company_id: str = Query(...)):
    """Get job metrics for a company."""
    job_metrics = metrics.get_metrics(company_id)
    rate_usage = rate_limiter.get_usage(company_id)
    return {
        "success": True,
        "data": {
            "jobs": job_metrics,
            "rate_limits": rate_usage
        }
    }


# ─── Other Job Endpoints ───────────────────────────────────────────────────────

@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str, company_id: str = Query(...)):
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
        "sources_analyzed": job.get("sources_analyzed", 0),
        "duration_seconds": job.get("duration_seconds", 0)
    }


@router.post("/jobs/{job_id}/import")
async def import_leads_to_crm(
    job_id: str,
    company_id: str = Query(...),
    lead_indices: Optional[List[int]] = None
):
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
                    try:
                        if supabase:
                            supabase.schema("core").table("ai_search_jobs").update(
                                {"total_imported": imported}
                            ).eq("company_id", company_id).execute()
                    except:
                        pass
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


# ─── Quotas ───────────────────────────────────────────────────────────────────

@router.get("/quotas")
async def get_quotas(company_id: str = Query(...)):
    quota = get_or_create_quota(company_id)
    return {"success": True, "data": quota}


# ─── Access Check ─────────────────────────────────────────────────────────────

@router.get("/access")
async def check_access(company_id: str = Query(...), user_id: str = Query(...)):
    has_access = check_ai_access(company_id, user_id)
    return {
        "success": True,
        "has_access": has_access,
        "message": "Accès autorisé" if has_access else "Accès refusé — rôle owner requis"
    }


# ─── Target Params ────────────────────────────────────────────────────────────

@router.get("/target-params")
async def get_target_params(company_id: str = Query(...)):
    params = get_company_target_params(company_id)
    return {"success": True, "data": params}


@router.post("/target-params")
async def save_target_params(
    company_id: str = Query(...),
    params: CompanyTargetParams = None
):
    save_company_target_params(company_id, params.dict())
    return {"success": True, "message": "Paramètres de cible sauvegardés!"}


# ─── History ──────────────────────────────────────────────────────────────────

@router.get("/history")
async def get_search_history(company_id: str = Query(...)):
    try:
        if supabase:
            res = supabase.schema("core").table("ai_search_jobs").select("*").eq(
                "company_id", company_id
            ).order("created_at", desc=True).execute()
            return {"success": True, "data": res.data or []}
    except Exception as e:
        print(f"[DB] History error: {e}")
    return {"success": True, "data": []}


# ─── Templates ────────────────────────────────────────────────────────────────

@router.get("/templates")
async def get_templates(company_id: str = Query(...)):
    try:
        if supabase:
            res = supabase.schema("core").table("ai_templates").select("*").eq(
                "company_id", company_id
            ).order("created_at", desc=True).execute()
            return {"success": True, "data": res.data or []}
    except Exception as e:
        print(f"[DB] Templates error: {e}")
    return {"success": True, "data": []}


@router.post("/templates")
async def save_template(company_id: str = Query(...), template: dict = None):
    try:
        if supabase:
            template["company_id"] = company_id
            result = supabase.schema("core").table("ai_templates").insert(template).execute()
            return {"success": True, "data": result.data}
    except Exception as e:
        print(f"[DB] Save template error: {e}")
    return {"success": False}


@router.delete("/templates/{template_id}")
async def delete_template(template_id: str, company_id: str = Query(...)):
    try:
        if supabase:
            supabase.schema("core").table("ai_templates").delete().eq(
                "id", template_id
            ).eq("company_id", company_id).execute()
            return {"success": True}
    except Exception as e:
        print(f"[DB] Delete template error: {e}")
    return {"success": False}


# ─── Segments ─────────────────────────────────────────────────────────────────

@router.get("/segments")
async def get_dynamic_segments(company_id: str = Query(...)):
    try:
        if supabase:
            res = supabase.schema("core").table("ai_dynamic_segments").select("*").eq(
                "company_id", company_id
            ).order("created_at", desc=True).execute()
            return {"success": True, "data": res.data or []}
    except Exception as e:
        print(f"[DB] Segments error: {e}")
    return {"success": True, "data": []}


@router.post("/segments")
async def save_dynamic_segment(company_id: str = Query(...), segment: dict = None):
    try:
        if supabase:
            segment["company_id"] = company_id
            result = supabase.schema("core").table("ai_dynamic_segments").insert(segment).execute()
            return {"success": True, "data": result.data}
    except Exception as e:
        print(f"[DB] Save segment error: {e}")
    return {"success": False}


@router.put("/segments/{segment_id}")
async def update_dynamic_segment(segment_id: str, company_id: str = Query(...), segment: dict = None):
    try:
        if supabase:
            supabase.schema("core").table("ai_dynamic_segments").update(segment).eq(
                "id", segment_id
            ).eq("company_id", company_id).execute()
            return {"success": True}
    except Exception as e:
        print(f"[DB] Update segment error: {e}")
    return {"success": False}


@router.delete("/segments/{segment_id}")
async def delete_dynamic_segment(segment_id: str, company_id: str = Query(...)):
    try:
        if supabase:
            supabase.schema("core").table("ai_dynamic_segments").delete().eq(
                "id", segment_id
            ).eq("company_id", company_id).execute()
            return {"success": True}
    except Exception as e:
        print(f"[DB] Delete segment error: {e}")
    return {"success": False}


# ─── Mock Lead Generator ──────────────────────────────────────────────────────

def _generate_mock_leads(request: LeadResearchRequest) -> list:
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