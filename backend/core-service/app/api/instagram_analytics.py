"""Instagram Analytics — real DB metrics aggregation."""
import asyncio
import os
from datetime import date, timedelta
from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query

from app.models.api_models import ApiError, ApiResponse
from app.models.http_status_enum import HttpStatus
from app.shared.auth_dependency import get__authenticated_user

router = APIRouter()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _base() -> str:
    return f"{os.getenv('SUPABASE_URL', '')}/rest/v1"


def _rh() -> dict:
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    return {"apikey": key, "Authorization": f"Bearer {key}", "Accept": "application/json"}


def _default_range(days: int = 7) -> tuple[str, str]:
    end = date.today()
    start = end - timedelta(days=days - 1)
    return start.isoformat(), end.isoformat()


async def _draft_ids_for_account(
    client: httpx.AsyncClient,
    company_id: str,
    account_id: str,
) -> list[str]:
    resp = await client.get(
        f"{_base()}/instagram_post_drafts",
        headers=_rh(),
        params={"company_id": f"eq.{company_id}", "account_id": f"eq.{account_id}", "select": "draft_id"},
    )
    if resp.status_code >= 400:
        return []
    return [r["draft_id"] for r in (resp.json() or []) if r.get("draft_id")]


async def _post_metrics_rows(
    client: httpx.AsyncClient,
    company_id: str,
    date_from: str,
    date_to: str,
    draft_ids: list[str] | None = None,
) -> list[dict]:
    # draft_ids=None → no account filter; draft_ids=[] → account has no drafts → return empty
    if draft_ids is not None and not draft_ids:
        return []

    # httpx accepts list-of-tuples for duplicate param keys (PostgREST needs both gte + lte on "date")
    params: list[tuple[str, str]] = [
        ("company_id", f"eq.{company_id}"),
        ("date", f"gte.{date_from}"),
        ("date", f"lte.{date_to}"),
        ("select", "*"),
        ("order", "date.asc"),
    ]
    if draft_ids:
        params.append(("draft_id", f"in.({','.join(draft_ids)})"))

    resp = await client.get(f"{_base()}/instagram_post_metrics_daily", headers=_rh(), params=params)
    if resp.status_code >= 400:
        return []
    return resp.json() if isinstance(resp.json(), list) else []


async def _account_metrics_rows(
    client: httpx.AsyncClient,
    company_id: str,
    date_from: str,
    date_to: str,
    account_id: str | None = None,
) -> list[dict]:
    params: list[tuple[str, str]] = [
        ("company_id", f"eq.{company_id}"),
        ("date", f"gte.{date_from}"),
        ("date", f"lte.{date_to}"),
        ("select", "*"),
        ("order", "date.asc"),
    ]
    if account_id:
        params.append(("account_id", f"eq.{account_id}"))

    resp = await client.get(f"{_base()}/instagram_account_metrics_daily", headers=_rh(), params=params)
    if resp.status_code >= 400:
        return []
    return resp.json() if isinstance(resp.json(), list) else []


def _aggregate_by_date(rows: list[dict]) -> list[dict]:
    bucket: dict[str, dict] = {}
    for r in rows:
        d = r.get("date", "")
        if d not in bucket:
            bucket[d] = {"date": d, "impressions": 0, "reach": 0, "likes": 0, "comments": 0, "shares": 0}
        bucket[d]["impressions"] += r.get("impressions") or 0
        bucket[d]["reach"]       += r.get("reach") or 0
        bucket[d]["likes"]       += r.get("likes_count") or 0
        bucket[d]["comments"]    += r.get("comments_count") or 0
        bucket[d]["shares"]      += r.get("shares_count") or 0
    return sorted(bucket.values(), key=lambda x: x["date"])


def _sum_rows(rows: list[dict]) -> dict:
    out = {"impressions": 0, "reach": 0, "likes": 0, "comments": 0, "shares": 0}
    for r in rows:
        out["impressions"] += r.get("impressions") or 0
        out["reach"]       += r.get("reach") or 0
        out["likes"]       += r.get("likes_count") or 0
        out["comments"]    += r.get("comments_count") or 0
        out["shares"]      += r.get("shares_count") or 0
    return out


def _pct(curr: float, prev: float) -> float | None:
    if prev == 0:
        return None
    return round((curr - prev) / prev * 100, 1)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/analytics/summary")
async def analytics_summary(
    current_user: Annotated[object, Depends(get__authenticated_user)],
    company_id: str = Query(...),
    account_id: str | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
):
    try:
        if not date_from or not date_to:
            date_from, date_to = _default_range(7)

        d0 = date.fromisoformat(date_from)
        d1 = date.fromisoformat(date_to)
        span = (d1 - d0).days + 1
        prev_to   = (d0 - timedelta(days=1)).isoformat()
        prev_from = (d0 - timedelta(days=span)).isoformat()

        async with httpx.AsyncClient() as client:
            draft_ids = (await _draft_ids_for_account(client, company_id, account_id)) if account_id else None
            curr_rows, prev_rows = await asyncio.gather(
                _post_metrics_rows(client, company_id, date_from, date_to, draft_ids),
                _post_metrics_rows(client, company_id, prev_from, prev_to, draft_ids),
            )

        curr = _sum_rows(curr_rows)
        prev = _sum_rows(prev_rows)

        return ApiResponse(message="Summary fetched", data={
            "current":   curr,
            "previous":  prev,
            "changes":   {f"{k}_pct": _pct(curr[k], prev[k]) for k in ("impressions", "reach", "likes", "comments")},
            "date_from": date_from,
            "date_to":   date_to,
        }, http_status=HttpStatus.OK).to_JSON()
    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


@router.get("/analytics/posts")
async def analytics_posts(
    current_user: Annotated[object, Depends(get__authenticated_user)],
    company_id: str = Query(...),
    account_id: str | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
):
    try:
        if not date_from or not date_to:
            date_from, date_to = _default_range(7)

        async with httpx.AsyncClient() as client:
            draft_ids = (await _draft_ids_for_account(client, company_id, account_id)) if account_id else None
            rows = await _post_metrics_rows(client, company_id, date_from, date_to, draft_ids)

        # Aggregate per-post (sum all dates per draft_id)
        by_post: dict[str, dict] = {}
        for r in rows:
            did = r.get("draft_id") or ""
            if did not in by_post:
                by_post[did] = {
                    "draft_id": did,
                    "impressions": 0, "reach": 0, "likes": 0, "comments": 0, "shares": 0,
                    "engagement_rate_sum": 0.0, "days": 0,
                }
            by_post[did]["impressions"] += r.get("impressions") or 0
            by_post[did]["reach"]       += r.get("reach") or 0
            by_post[did]["likes"]       += r.get("likes_count") or 0
            by_post[did]["comments"]    += r.get("comments_count") or 0
            by_post[did]["shares"]      += r.get("shares_count") or 0
            by_post[did]["engagement_rate_sum"] += r.get("engagement_rate") or 0.0
            by_post[did]["days"] += 1

        # Fetch draft captions for these posts
        draft_id_list = [k for k in by_post if k]
        draft_info: dict[str, dict] = {}
        if draft_id_list:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{_base()}/instagram_post_drafts",
                    headers=_rh(),
                    params={"draft_id": f"in.({','.join(draft_id_list)})", "select": "draft_id,caption,content_type,updated_at"},
                )
                if resp.status_code < 400:
                    for row in (resp.json() or []):
                        draft_info[row["draft_id"]] = row

        enriched = []
        for p in by_post.values():
            days = p.pop("days")
            er_sum = p.pop("engagement_rate_sum")
            info = draft_info.get(p["draft_id"], {})
            enriched.append({
                **p,
                "engagement_rate": round(er_sum / days, 4) if days else 0.0,
                "caption":         info.get("caption"),
                "content_type":    info.get("content_type"),
                "updated_at":      info.get("updated_at"),
            })
        enriched.sort(key=lambda x: x["impressions"], reverse=True)

        return ApiResponse(message="Post analytics fetched", data={
            "by_date": _aggregate_by_date(rows),
            "by_post": enriched,
            "totals":  _sum_rows(rows),
        }, http_status=HttpStatus.OK).to_JSON()
    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


@router.get("/analytics/account")
async def analytics_account(
    current_user: Annotated[object, Depends(get__authenticated_user)],
    company_id: str = Query(...),
    account_id: str | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
):
    try:
        if not date_from or not date_to:
            date_from, date_to = _default_range(7)

        async with httpx.AsyncClient() as client:
            rows = await _account_metrics_rows(client, company_id, date_from, date_to, account_id)

        by_date = [
            {
                "date":            r.get("date"),
                "followers_count": r.get("followers_count") or 0,
                "following_count": r.get("following_count") or 0,
                "media_count":     r.get("media_count") or 0,
            }
            for r in rows
        ]

        latest = by_date[-1] if by_date else None
        first  = by_date[0]  if by_date else None
        follower_change = (latest["followers_count"] - first["followers_count"]) if latest and first else 0

        return ApiResponse(message="Account analytics fetched", data={
            "by_date":         by_date,
            "latest":          latest,
            "follower_change": follower_change,
        }, http_status=HttpStatus.OK).to_JSON()
    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()
