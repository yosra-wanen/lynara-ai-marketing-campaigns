"""Instagram Studio — accounts, drafts, media.

All Supabase queries use the PostgREST REST API directly via httpx, passing
  Accept-Profile: instagram   (for reads)
  Content-Profile: instagram  (for writes)
so the instagram schema does NOT need to be listed under
Supabase > Settings > API > "Exposed schemas".
All user-supplied filter values are kept in URL params — no string
interpolation of values in query strings.
"""

import asyncio
import os
from datetime import datetime, timezone
from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.models.api_models import ApiError, ApiResponse
from app.models.http_status_enum import HttpStatus
from app.shared.auth_dependency import get__authenticated_user

router = APIRouter()


# ── Supabase REST helpers ─────────────────────────────────────────────────────

def _base() -> str:
    return f"{os.getenv('SUPABASE_URL', '')}/rest/v1"


def _rh(extra_prefer: str | None = None) -> dict:
    """Headers for read (GET/HEAD) requests."""
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    h = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Accept": "application/json",
    }
    if extra_prefer:
        h["Prefer"] = extra_prefer
    return h


def _wh(prefer: str = "return=representation") -> dict:
    """Headers for write (POST/PATCH/DELETE) requests."""
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Prefer": prefer,
    }


def _pg_err(resp: httpx.Response) -> str:
    """Extract human-readable message from a PostgREST error response."""
    try:
        body = resp.json()
        return body.get("message") or body.get("error") or f"HTTP {resp.status_code}"
    except Exception:
        return f"HTTP {resp.status_code}: {resp.text[:200]}"


def _first(resp: httpx.Response):
    """Return first row from a list response, or None."""
    rows = resp.json()
    return rows[0] if isinstance(rows, list) and rows else None


def _count(resp: httpx.Response) -> int:
    """Parse total row count from Content-Range header (e.g. '0-19/42' → 42)."""
    cr = resp.headers.get("content-range", "")
    if "/" in cr:
        tail = cr.split("/")[-1]
        if tail.isdigit():
            return int(tail)
    return 0


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class AccountCreate(BaseModel):
    company_id: str
    instagram_account_id: str
    username: str
    account_name: str | None = None
    profile_picture_url: str | None = None
    access_token_encrypted: str
    token_expires_at: str | None = None


class DraftCreate(BaseModel):
    company_id: str
    account_id: str | None = None
    caption: str | None = None
    content_type: str = "post"
    source_mode: str = "libre"
    catalog_item_id: str | None = None


class DraftUpdate(BaseModel):
    account_id: str | None = None
    caption: str | None = None
    content_type: str | None = None
    source_mode: str | None = None
    catalog_item_id: str | None = None
    status: str | None = None


class MediaAdd(BaseModel):
    media_url: str
    media_type: str = "image"
    position: int = 0
    source: str | None = None


# ── Accounts ──────────────────────────────────────────────────────────────────

@router.get("/accounts")
async def list_accounts(
    current_user: Annotated[object, Depends(get__authenticated_user)],
    company_id: str = Query(...),
):
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{_base()}/instagram_accounts",
                headers=_rh(),
                params={"company_id": f"eq.{company_id}", "order": "created_at.desc", "select": "*"},
            )
        if resp.status_code >= 400:
            raise HTTPException(status_code=resp.status_code, detail=_pg_err(resp))
        return ApiResponse(message="Accounts fetched", data=resp.json(), http_status=HttpStatus.OK).to_JSON()
    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


@router.post("/accounts")
async def create_account(
    payload: AccountCreate,
    current_user: Annotated[object, Depends(get__authenticated_user)],
):
    try:
        body = {
            **payload.model_dump(exclude_none=True),
            "connected_by": str(current_user.id),
            "is_active": True,
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{_base()}/instagram_accounts",
                headers=_wh(),
                json=body,
            )
        if resp.status_code >= 400:
            raise HTTPException(status_code=resp.status_code, detail=_pg_err(resp))
        row = _first(resp)
        if not row:
            raise HTTPException(status_code=400, detail="Erreur création compte Instagram")
        return ApiResponse(message="Account connected", data=row, http_status=HttpStatus.OK).to_JSON()
    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


@router.delete("/accounts/{account_id}")
async def disconnect_account(
    account_id: str,
    current_user: Annotated[object, Depends(get__authenticated_user)],
):
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.patch(
                f"{_base()}/instagram_accounts",
                headers=_wh("return=minimal"),
                params={"account_id": f"eq.{account_id}"},
                json={"is_active": False, "access_token_encrypted": None},
            )
        if resp.status_code >= 400:
            raise HTTPException(status_code=resp.status_code, detail=_pg_err(resp))
        return ApiResponse(message="Account disconnected", http_status=HttpStatus.OK).to_JSON()
    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


# ── Drafts ────────────────────────────────────────────────────────────────────

@router.get("/drafts")
async def list_drafts(
    current_user: Annotated[object, Depends(get__authenticated_user)],
    company_id: str = Query(...),
    status: str | None = Query(None),
    account_id: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    try:
        params: dict = {
            "company_id": f"eq.{company_id}",
            "order": "updated_at.desc",
            "select": "*",
            "limit": page_size,
            "offset": (page - 1) * page_size,
        }
        if status:
            params["status"] = f"eq.{status}"
        if account_id:
            params["account_id"] = f"eq.{account_id}"

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{_base()}/instagram_post_drafts",
                headers=_rh("count=exact"),
                params=params,
            )
        if resp.status_code >= 400:
            raise HTTPException(status_code=resp.status_code, detail=_pg_err(resp))
        return {"data": resp.json(), "total": _count(resp), "page": page, "page_size": page_size}
    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


@router.post("/drafts")
async def create_draft(
    payload: DraftCreate,
    current_user: Annotated[object, Depends(get__authenticated_user)],
):
    try:
        body = {
            **payload.model_dump(exclude_none=True),
            "status": "draft",
            "created_by": str(current_user.id),
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{_base()}/instagram_post_drafts",
                headers=_wh(),
                json=body,
            )
        if resp.status_code >= 400:
            raise HTTPException(status_code=resp.status_code, detail=_pg_err(resp))
        row = _first(resp)
        if not row:
            raise HTTPException(status_code=400, detail="Erreur création brouillon")
        return ApiResponse(message="Draft created", data=row, http_status=HttpStatus.OK).to_JSON()
    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


@router.get("/drafts/{draft_id}")
async def get_draft(
    draft_id: str,
    current_user: Annotated[object, Depends(get__authenticated_user)],
):
    try:
        async with httpx.AsyncClient() as client:
            # Fetch draft and media in parallel
            draft_resp, media_resp = await asyncio.gather(
                client.get(
                    f"{_base()}/instagram_post_drafts",
                    headers=_rh(),
                    params={"draft_id": f"eq.{draft_id}", "select": "*"},
                ),
                client.get(
                    f"{_base()}/instagram_post_media_items",
                    headers=_rh(),
                    params={"draft_id": f"eq.{draft_id}", "order": "position.asc", "select": "*"},
                ),
            )

        if draft_resp.status_code >= 400:
            raise HTTPException(status_code=draft_resp.status_code, detail=_pg_err(draft_resp))

        draft = _first(draft_resp)
        if not draft:
            raise HTTPException(status_code=404, detail="Brouillon introuvable")

        draft["media_items"] = media_resp.json() if media_resp.status_code < 400 else []
        return ApiResponse(message="Draft fetched", data=draft, http_status=HttpStatus.OK).to_JSON()
    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


@router.patch("/drafts/{draft_id}")
async def update_draft(
    draft_id: str,
    payload: DraftUpdate,
    current_user: Annotated[object, Depends(get__authenticated_user)],
):
    try:
        data = {k: v for k, v in payload.model_dump().items() if v is not None}
        if not data:
            raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour")
        data["updated_at"] = datetime.now(timezone.utc).isoformat()

        async with httpx.AsyncClient() as client:
            resp = await client.patch(
                f"{_base()}/instagram_post_drafts",
                headers=_wh(),
                params={"draft_id": f"eq.{draft_id}"},
                json=data,
            )
        if resp.status_code >= 400:
            raise HTTPException(status_code=resp.status_code, detail=_pg_err(resp))
        row = _first(resp)
        if not row:
            raise HTTPException(status_code=404, detail="Brouillon introuvable")
        return ApiResponse(message="Draft updated", data=row, http_status=HttpStatus.OK).to_JSON()
    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


@router.delete("/drafts/{draft_id}")
async def delete_draft(
    draft_id: str,
    current_user: Annotated[object, Depends(get__authenticated_user)],
):
    try:
        async with httpx.AsyncClient() as client:
            # Delete related rows in parallel first, then the draft itself
            await asyncio.gather(
                client.delete(
                    f"{_base()}/instagram_post_media_items",
                    headers=_wh("return=minimal"),
                    params={"draft_id": f"eq.{draft_id}"},
                ),
                client.delete(
                    f"{_base()}/instagram_post_schedule_jobs",
                    headers=_wh("return=minimal"),
                    params={"draft_id": f"eq.{draft_id}"},
                ),
            )
            await client.delete(
                f"{_base()}/instagram_post_drafts",
                headers=_wh("return=minimal"),
                params={"draft_id": f"eq.{draft_id}"},
            )
        return ApiResponse(message="Draft deleted", http_status=HttpStatus.OK).to_JSON()
    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


@router.post("/drafts/{draft_id}/media")
async def add_media(
    draft_id: str,
    payload: MediaAdd,
    current_user: Annotated[object, Depends(get__authenticated_user)],
):
    try:
        async with httpx.AsyncClient() as client:
            check = await client.get(
                f"{_base()}/instagram_post_drafts",
                headers=_rh(),
                params={"draft_id": f"eq.{draft_id}", "select": "draft_id"},
            )
            if not check.json():
                raise HTTPException(status_code=404, detail="Brouillon introuvable")

            resp = await client.post(
                f"{_base()}/instagram_post_media_items",
                headers=_wh(),
                json={**payload.model_dump(exclude_none=True), "draft_id": draft_id},
            )
        if resp.status_code >= 400:
            raise HTTPException(status_code=resp.status_code, detail=_pg_err(resp))
        row = _first(resp)
        if not row:
            raise HTTPException(status_code=400, detail="Erreur ajout média")
        return ApiResponse(message="Media added", data=row, http_status=HttpStatus.OK).to_JSON()
    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


@router.delete("/drafts/{draft_id}/media/{media_item_id}")
async def delete_media(
    draft_id: str,
    media_item_id: str,
    current_user: Annotated[object, Depends(get__authenticated_user)],
):
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.delete(
                f"{_base()}/instagram_post_media_items",
                headers=_wh("return=minimal"),
                params={
                    "media_item_id": f"eq.{media_item_id}",
                    "draft_id": f"eq.{draft_id}",
                },
            )
        if resp.status_code >= 400:
            raise HTTPException(status_code=resp.status_code, detail=_pg_err(resp))
        return ApiResponse(message="Media deleted", http_status=HttpStatus.OK).to_JSON()
    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


class ScheduleRequest(BaseModel):
    scheduled_time: str  # ISO 8601 e.g. "2025-05-20T14:30:00+01:00" — real DB column name


@router.post("/drafts/{draft_id}/schedule")
async def schedule_draft(
    draft_id: str,
    payload: ScheduleRequest,
    current_user: Annotated[object, Depends(get__authenticated_user)],
):
    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        async with httpx.AsyncClient() as client:
            draft_resp = await client.get(
                f"{_base()}/instagram_post_drafts",
                headers=_rh(),
                params={"draft_id": f"eq.{draft_id}", "select": "draft_id,company_id,status"},
            )
            if draft_resp.status_code >= 400:
                raise HTTPException(status_code=draft_resp.status_code, detail=_pg_err(draft_resp))
            draft = _first(draft_resp)
            if not draft:
                raise HTTPException(status_code=404, detail="Brouillon introuvable")
            if draft["status"] == "published":
                raise HTTPException(status_code=400, detail="Ce brouillon est déjà publié")

            job_resp = await client.post(
                f"{_base()}/instagram_post_schedule_jobs",
                headers=_wh(),
                json={
                    "draft_id": draft_id,
                    "company_id": draft["company_id"],
                    "scheduled_time": payload.scheduled_time,
                    "status": "pending",
                },
            )
            if job_resp.status_code >= 400:
                raise HTTPException(status_code=job_resp.status_code, detail=_pg_err(job_resp))
            job = _first(job_resp)

            await client.patch(
                f"{_base()}/instagram_post_drafts",
                headers=_wh("return=minimal"),
                params={"draft_id": f"eq.{draft_id}"},
                json={"status": "scheduled", "updated_at": now_iso},
            )

        return ApiResponse(message="Draft scheduled", data=job, http_status=HttpStatus.OK).to_JSON()
    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


@router.get("/jobs")
async def list_jobs(
    current_user: Annotated[object, Depends(get__authenticated_user)],
    company_id: str = Query(...),
    status: str | None = Query(None),
    draft_id: str | None = Query(None),
):
    try:
        params: dict = {
            "company_id": f"eq.{company_id}",
            "order": "scheduled_time.asc",
            "select": "*",
        }
        if status:
            params["status"] = f"eq.{status}"
        if draft_id:
            params["draft_id"] = f"eq.{draft_id}"

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{_base()}/instagram_post_schedule_jobs",
                headers=_rh(),
                params=params,
            )
        if resp.status_code >= 400:
            raise HTTPException(status_code=resp.status_code, detail=_pg_err(resp))
        return ApiResponse(message="Jobs fetched", data=resp.json(), http_status=HttpStatus.OK).to_JSON()
    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


@router.delete("/jobs/{job_id}")
async def cancel_job(
    job_id: str,
    current_user: Annotated[object, Depends(get__authenticated_user)],
):
    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        async with httpx.AsyncClient() as client:
            job_resp = await client.get(
                f"{_base()}/instagram_post_schedule_jobs",
                headers=_rh(),
                params={"job_id": f"eq.{job_id}", "select": "job_id,draft_id,status"},
            )
            if job_resp.status_code >= 400:
                raise HTTPException(status_code=job_resp.status_code, detail=_pg_err(job_resp))
            job = _first(job_resp)
            if not job:
                raise HTTPException(status_code=404, detail="Job introuvable")
            if job["status"] != "pending":
                raise HTTPException(status_code=400, detail="Ce job ne peut pas être annulé")

            await asyncio.gather(
                client.patch(
                    f"{_base()}/instagram_post_schedule_jobs",
                    headers=_wh("return=minimal"),
                    params={"job_id": f"eq.{job_id}"},
                    json={"status": "cancelled"},
                ),
                client.patch(
                    f"{_base()}/instagram_post_drafts",
                    headers=_wh("return=minimal"),
                    params={"draft_id": f"eq.{job['draft_id']}"},
                    json={"status": "draft", "updated_at": now_iso},
                ),
            )

        return ApiResponse(message="Job cancelled", http_status=HttpStatus.OK).to_JSON()
    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


@router.post("/drafts/{draft_id}/publish")
async def publish_draft(
    draft_id: str,
    current_user: Annotated[object, Depends(get__authenticated_user)],
):
    try:
        now = datetime.now(timezone.utc).isoformat()
        async with httpx.AsyncClient() as client:
            resp = await client.patch(
                f"{_base()}/instagram_post_drafts",
                headers=_wh(),
                params={"draft_id": f"eq.{draft_id}"},
                json={"status": "published", "updated_at": now},
            )
        if resp.status_code >= 400:
            raise HTTPException(status_code=resp.status_code, detail=_pg_err(resp))
        row = _first(resp)
        if not row:
            raise HTTPException(status_code=404, detail="Brouillon introuvable")
        return ApiResponse(message="Draft published", data=row, http_status=HttpStatus.OK).to_JSON()
    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()
