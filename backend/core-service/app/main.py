"""FastAPI application - Auth, OCR, Catalogue, Suppliers, logique métier."""
import asyncio
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone as dt_timezone

import httpx
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, ocr, profile, company, catalog, suppliers, ai_config, admin, instagram, instagram_analytics, instagram_recommendations


# ── Background scheduler ──────────────────────────────────────────────────────

async def _publish_due_jobs() -> None:
    base_url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not base_url or not key:
        return

    base = f"{base_url}/rest/v1"
    rh = {"apikey": key, "Authorization": f"Bearer {key}", "Accept": "application/json"}
    wh = {**rh, "Content-Type": "application/json", "Prefer": "return=minimal"}
    now = datetime.now(dt_timezone.utc).isoformat()

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{base}/instagram_post_schedule_jobs",
                headers=rh,
                params={
                    "status": "eq.pending",
                    "scheduled_time": f"lte.{now}",
                    "select": "job_id,draft_id",
                },
            )
            if resp.status_code >= 400:
                return
            jobs = resp.json() if isinstance(resp.json(), list) else []
            for job in jobs:
                try:
                    await asyncio.gather(
                        client.patch(
                            f"{base}/instagram_post_schedule_jobs",
                            headers=wh,
                            params={"job_id": f"eq.{job['job_id']}"},
                            json={"status": "published", "executed_at": now},
                        ),
                        client.patch(
                            f"{base}/instagram_post_drafts",
                            headers=wh,
                            params={"draft_id": f"eq.{job['draft_id']}"},
                            json={"status": "published", "updated_at": now},
                        ),
                    )
                    print(f"[SCHEDULER] Published job {job['job_id']} / draft {job['draft_id']}")
                except Exception as exc:
                    print(f"[SCHEDULER] Error publishing job {job['job_id']}: {exc}")
    except Exception as exc:
        print(f"[SCHEDULER] Error fetching due jobs: {exc}")


async def _catch_up_missed_jobs() -> None:
    """On startup: publish any jobs whose scheduled_time passed while the server was down."""
    base_url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not base_url or not key:
        return

    base = f"{base_url}/rest/v1"
    rh = {"apikey": key, "Authorization": f"Bearer {key}", "Accept": "application/json"}
    wh = {**rh, "Content-Type": "application/json", "Prefer": "return=minimal"}
    now = datetime.now(dt_timezone.utc).isoformat()

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{base}/instagram_post_schedule_jobs",
                headers=rh,
                params={
                    "status": "eq.pending",
                    "scheduled_time": f"lte.{now}",
                    "select": "job_id,draft_id",
                },
            )
            if resp.status_code >= 400:
                print(f"[CATCH-UP] Failed to query missed jobs (HTTP {resp.status_code})")
                return
            jobs = resp.json() if isinstance(resp.json(), list) else []
            if not jobs:
                print("[CATCH-UP] No missed jobs.")
                return
            print(f"[CATCH-UP] Publishing {len(jobs)} missed job(s)…")
            for job in jobs:
                try:
                    await asyncio.gather(
                        client.patch(
                            f"{base}/instagram_post_schedule_jobs",
                            headers=wh,
                            params={"job_id": f"eq.{job['job_id']}"},
                            json={"status": "published", "executed_at": now},
                        ),
                        client.patch(
                            f"{base}/instagram_post_drafts",
                            headers=wh,
                            params={"draft_id": f"eq.{job['draft_id']}"},
                            json={"status": "published", "updated_at": now},
                        ),
                    )
                    print(f"[CATCH-UP] Published missed job {job['job_id']} / draft {job['draft_id']}")
                except Exception as exc:
                    print(f"[CATCH-UP] Error on job {job['job_id']}: {exc}")
    except Exception as exc:
        print(f"[CATCH-UP] Error: {exc}")


async def _scheduler_loop() -> None:
    while True:
        await asyncio.sleep(60)
        await _publish_due_jobs()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Publish anything missed while the server was offline, then start the periodic loop
    await _catch_up_missed_jobs()
    task = asyncio.create_task(_scheduler_loop())
    try:
        yield
    finally:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


# ── Application ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="Lynara Campaign Core Service",
    description="Authentification, OCR, Catalogue et logique métier backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(ocr.router, prefix="/ocr", tags=["ocr"])
app.include_router(profile.router, prefix="/profile", tags=["profile"])
app.include_router(company.router, prefix="/company", tags=["company"])
app.include_router(catalog.router, prefix="/catalog", tags=["catalog"])
app.include_router(suppliers.router, prefix="/catalog/suppliers", tags=["suppliers"])
app.include_router(ai_config.router, prefix="/company/{company_id}/ai-configs", tags=["ai-config"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(instagram.router, prefix="/instagram", tags=["instagram"])
app.include_router(instagram_analytics.router, prefix="/instagram", tags=["instagram-analytics"])
app.include_router(instagram_recommendations.router, prefix="/instagram", tags=["instagram-recommendations"])


@app.get("/")
async def root():
    return {
        "service": "lynara-campaign-core-service",
        "message": "Auth, OCR, Catalogue et logique métier",
    }


@app.get("/health")
async def health():
    return {"status": "ok", "service": "lynara-campaign-core-service"}
