"""Instagram AI Recommendations — posting-time, caption tips, weekly report."""
import asyncio
import os
import re
from collections import defaultdict
from datetime import date, datetime, timedelta
from datetime import timezone as dt_timezone
from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query

from app.models.api_models import ApiError, ApiResponse
from app.models.http_status_enum import HttpStatus
from app.shared.auth_dependency import get__authenticated_user

router = APIRouter()

# Africa/Tunis is permanently UTC+1 (no DST)
_TUNIS_OFFSET = 1

_DAYS_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

# Research-based defaults for Tunisian market — returned when no real data exists.
# Field names match the TypeScript PostingSlot interface.
_DEFAULT_SLOTS = [
    {"day": "Mardi",    "hour": 8,  "label": "Mardi 08:00",    "score": 0.85},
    {"day": "Vendredi", "hour": 20, "label": "Vendredi 20:00", "score": 0.80},
    {"day": "Jeudi",    "hour": 12, "label": "Jeudi 12:00",    "score": 0.72},
]

_DEFAULT_HEATMAP = [
    0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
    0.1, 0.3, 0.85, 0.5, 0.3, 0.2,   # 6–11
    0.5, 0.4, 0.3, 0.2, 0.3, 0.5,    # 12–17
    0.6, 0.7, 0.80, 0.6, 0.3, 0.1,   # 18–23
]

# Field names match the TypeScript CaptionTip interface: {tip, reason}
_GENERIC_CAPTION_TIPS = [
    {
        "tip":    "Publiez en soirée",
        "reason": "En Tunisie, les posts publiés entre 19h et 21h obtiennent généralement le meilleur engagement.",
    },
    {
        "tip":    "Utilisez 8 à 12 hashtags",
        "reason": "Les posts avec 8 à 12 hashtags ciblés ont un meilleur reach que ceux avec 30 hashtags génériques.",
    },
    {
        "tip":    "Commencez par un emoji",
        "reason": "Les légendes qui commencent par un emoji obtiennent en moyenne 15% plus d'interactions.",
    },
    {
        "tip":    "Posez une question",
        "reason": "Terminer votre légende par une question augmente les commentaires de 25% en moyenne.",
    },
    {
        "tip":    "Publiez régulièrement",
        "reason": "Publier 3 à 5 fois par semaine maintient l'algorithme Instagram en votre faveur.",
    },
]

# Weekly tips as plain strings (matches TypeScript WeeklyReportData.tips: string[])
_GENERIC_WEEKLY_TIPS = [
    "Publiez entre 19h et 21h pour maximiser l'engagement en Tunisie.",
    "Utilisez 8 à 12 hashtags ciblés pour améliorer votre reach.",
    "Commencez vos légendes par un emoji pour capter l'attention.",
]


# ── Shared helpers ─────────────────────────────────────────────────────────────

def _base() -> str:
    return f"{os.getenv('SUPABASE_URL', '')}/rest/v1"


def _rh() -> dict:
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    return {"apikey": key, "Authorization": f"Bearer {key}", "Accept": "application/json"}


def _to_tunis_hour(iso_str: str) -> int | None:
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        utc_hour = dt.astimezone(dt_timezone.utc).hour
        return (utc_hour + _TUNIS_OFFSET) % 24
    except Exception:
        return None


def _to_weekday(iso_str: str) -> int | None:
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        dt_tunis = dt.astimezone(dt_timezone.utc) + timedelta(hours=_TUNIS_OFFSET)
        return dt_tunis.weekday()  # 0=Monday
    except Exception:
        return None


def _sum_rows(rows: list[dict]) -> dict:
    out = {"impressions": 0, "reach": 0, "likes": 0, "comments": 0, "shares": 0}
    for r in rows:
        out["impressions"] += r.get("impressions") or 0
        out["reach"]       += r.get("reach") or 0
        out["likes"]       += r.get("likes_count") or 0
        out["comments"]    += r.get("comments_count") or 0
        out["shares"]      += r.get("shares_count") or 0
    return out


async def _metrics_rows(
    client: httpx.AsyncClient,
    company_id: str,
    date_from: str,
    date_to: str,
    draft_ids: list[str] | None = None,
) -> list[dict]:
    if draft_ids is not None and not draft_ids:
        return []
    params: list[tuple[str, str]] = [
        ("company_id", f"eq.{company_id}"),
        ("date", f"gte.{date_from}"),
        ("date", f"lte.{date_to}"),
        ("select", "*"),
    ]
    if draft_ids:
        params.append(("draft_id", f"in.({','.join(draft_ids[:200])})"))
    resp = await client.get(f"{_base()}/instagram_post_metrics_daily", headers=_rh(), params=params)
    if resp.status_code >= 400:
        return []
    return resp.json() if isinstance(resp.json(), list) else []


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


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/recommendations/posting-time")
async def recommend_posting_time(
    current_user: Annotated[object, Depends(get__authenticated_user)],
    company_id: str = Query(...),
    account_id: str | None = Query(None),
):
    """Analyse published draft timestamps + engagement to find best posting hours."""
    try:
        params: list[tuple[str, str]] = [
            ("company_id", f"eq.{company_id}"),
            ("status", "eq.published"),
            ("select", "draft_id,updated_at"),
            ("limit", "200"),
        ]
        if account_id:
            params.append(("account_id", f"eq.{account_id}"))

        async with httpx.AsyncClient() as client:
            drafts_resp = await client.get(
                f"{_base()}/instagram_post_drafts",
                headers=_rh(),
                params=params,
            )
        drafts = drafts_resp.json() if drafts_resp.status_code < 400 else []
        if not isinstance(drafts, list):
            drafts = []

        # Build map: draft_id → (tunis_hour, weekday)
        draft_time: dict[str, tuple[int, int]] = {}
        for d in drafts:
            h  = _to_tunis_hour(d.get("updated_at") or "")
            wd = _to_weekday(d.get("updated_at") or "")
            if h is not None and wd is not None:
                draft_time[d["draft_id"]] = (h, wd)

        if not draft_time:
            # Return defaults — field names match TS PostingTimeData interface
            return ApiResponse(message="Posting-time defaults", data={
                "top_slots":  _DEFAULT_SLOTS,
                "heatmap":    _DEFAULT_HEATMAP,
                "data_based": False,
            }, http_status=HttpStatus.OK).to_JSON()

        # Fetch metrics for those drafts
        async with httpx.AsyncClient() as client:
            m_resp = await client.get(
                f"{_base()}/instagram_post_metrics_daily",
                headers=_rh(),
                params={"draft_id": f"in.({','.join(list(draft_time)[:100])})", "select": "draft_id,engagement_rate"},
            )
        mrows = m_resp.json() if m_resp.status_code < 400 else []
        if not isinstance(mrows, list):
            mrows = []

        # draft → avg engagement
        eng: dict[str, list[float]] = defaultdict(list)
        for m in mrows:
            er = m.get("engagement_rate")
            if er is not None:
                eng[m["draft_id"]].append(float(er))

        # Slot → scores  key=(weekday, hour)
        slot_scores: dict[tuple[int, int], list[float]] = defaultdict(list)
        for did, (h, wd) in draft_time.items():
            score = (sum(eng[did]) / len(eng[did])) if eng.get(did) else 0.5
            slot_scores[(wd, h)].append(score)

        slot_avg = {slot: sum(v) / len(v) for slot, v in slot_scores.items()}
        max_score = max(slot_avg.values(), default=1)
        top3 = sorted(slot_avg.items(), key=lambda x: -x[1])[:3]

        # Field names match TS PostingSlot interface: {day, hour, label, score}
        top_slots = [
            {
                "day":   _DAYS_FR[wd],
                "hour":  h,
                "label": f"{_DAYS_FR[wd]} {h:02d}:00",
                "score": round(avg / max_score, 2),
            }
            for (wd, h), avg in top3
        ]

        # 24-h heatmap (collapse weekdays, normalize)
        hour_scores: dict[int, list[float]] = defaultdict(list)
        for (_, h), avg in slot_avg.items():
            hour_scores[h].append(avg)
        raw = {h: sum(v) / len(v) for h, v in hour_scores.items()}
        hmax = max(raw.values(), default=1)
        heatmap = [round(raw.get(h, 0) / hmax, 2) for h in range(24)]

        return ApiResponse(message="Posting-time from data", data={
            "top_slots":  top_slots,
            "heatmap":    heatmap,
            "data_based": True,
        }, http_status=HttpStatus.OK).to_JSON()
    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


@router.get("/recommendations/captions")
async def recommend_captions(
    current_user: Annotated[object, Depends(get__authenticated_user)],
    company_id: str = Query(...),
    account_id: str | None = Query(None),
):
    """Analyse top-engagement captions and return data-driven tips."""
    try:
        d90 = (date.today() - timedelta(days=90)).isoformat()
        today = date.today().isoformat()

        params: list[tuple[str, str]] = [
            ("company_id", f"eq.{company_id}"),
            ("date", f"gte.{d90}"),
            ("date", f"lte.{today}"),
            ("order", "engagement_rate.desc.nullslast"),
            ("limit", "20"),
            ("select", "draft_id,engagement_rate,likes_count,impressions"),
        ]

        async with httpx.AsyncClient() as client:
            if account_id:
                acc_ids = await _draft_ids_for_account(client, company_id, account_id)
                if not acc_ids:
                    # Field names match TS CaptionRecommendations interface
                    return ApiResponse(message="Caption tips defaults", data={
                        "tips":         _GENERIC_CAPTION_TIPS[:3],
                        "top_captions": [],
                        "data_based":   False,
                    }, http_status=HttpStatus.OK).to_JSON()
                params.append(("draft_id", f"in.({','.join(acc_ids[:100])})"))

            m_resp = await client.get(
                f"{_base()}/instagram_post_metrics_daily",
                headers=_rh(),
                params=params,
            )
        mrows = m_resp.json() if m_resp.status_code < 400 else []
        if not isinstance(mrows, list) or not mrows:
            return ApiResponse(message="Caption tips defaults", data={
                "tips":         _GENERIC_CAPTION_TIPS[:3],
                "top_captions": [],
                "data_based":   False,
            }, http_status=HttpStatus.OK).to_JSON()

        # Unique draft_ids (preserve engagement-sorted order)
        seen: set[str] = set()
        top_ids: list[str] = []
        for m in mrows:
            did = m.get("draft_id")
            if did and did not in seen:
                seen.add(did)
                top_ids.append(did)
            if len(top_ids) >= 10:
                break

        async with httpx.AsyncClient() as client:
            d_resp = await client.get(
                f"{_base()}/instagram_post_drafts",
                headers=_rh(),
                params={"draft_id": f"in.({','.join(top_ids)})", "select": "draft_id,caption"},
            )
        drafts = d_resp.json() if d_resp.status_code < 400 else []
        cap_map = {d["draft_id"]: d["caption"] for d in (drafts if isinstance(drafts, list) else []) if d.get("caption")}

        # Best captions (top 3 by engagement) — field names match TS TopCaption: {caption, engagement_rate}
        top_captions = []
        eng_map: dict[str, float] = {}
        for m in mrows:
            did = m.get("draft_id")
            if did and m.get("engagement_rate") is not None:
                eng_map[did] = max(eng_map.get(did, 0), float(m["engagement_rate"]))
        for did in top_ids:
            if did in cap_map:
                top_captions.append({
                    "caption":         cap_map[did],
                    "engagement_rate": round(eng_map.get(did, 0), 4),
                })
            if len(top_captions) >= 3:
                break

        # Data-driven tips — field names match TS CaptionTip: {tip, reason}
        tips = _caption_tips(cap_map, eng_map)

        return ApiResponse(message="Caption tips from data", data={
            "tips":         tips,
            "top_captions": top_captions,
            "data_based":   True,
        }, http_status=HttpStatus.OK).to_JSON()
    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


def _caption_tips(cap_map: dict[str, str], eng_map: dict[str, float]) -> list[dict]:
    """Generate 3–5 actionable tips from caption analysis. Returns {tip, reason} dicts."""
    posts = [
        {
            "er":       eng_map.get(did, 0),
            "emoji":    bool(re.search(r"[\U0001F300-\U0001FFFF\U00002600-\U000027BF]", cap)),
            "question": "?" in cap,
            "hashtags": len(re.findall(r"#\w+", cap)),
        }
        for did, cap in cap_map.items()
    ]
    if len(posts) < 3:
        return _GENERIC_CAPTION_TIPS[:3]

    tips: list[dict] = []
    avg_er = sum(p["er"] for p in posts) / len(posts) or 0.001

    # Emoji tip
    with_e = [p for p in posts if p["emoji"]]
    no_e   = [p for p in posts if not p["emoji"]]
    if with_e and no_e:
        avg_with = sum(p["er"] for p in with_e) / len(with_e)
        avg_no   = sum(p["er"] for p in no_e)   / len(no_e)
        pct = round((avg_with - avg_no) / (avg_no or 0.001) * 100)
        if avg_with > avg_no:
            tips.append({
                "tip":    "Utilisez des emojis",
                "reason": f"Vos posts avec emojis obtiennent {pct}% d'engagement en plus.",
            })
        else:
            tips.append(_GENERIC_CAPTION_TIPS[2])

    # Question tip
    with_q = [p for p in posts if p["question"]]
    if with_q:
        avg_q = sum(p["er"] for p in with_q) / len(with_q)
        if avg_q > avg_er:
            tips.append({
                "tip":    "Posez des questions",
                "reason": "Vos posts avec une question génèrent plus de commentaires et d'interactions.",
            })

    # Hashtag tip
    avg_ht = sum(p["hashtags"] for p in posts) / len(posts)
    if avg_ht < 5:
        tips.append({
            "tip":    "Ajoutez plus de hashtags",
            "reason": f"Vous utilisez {avg_ht:.0f} hashtags en moyenne. Visez 8 à 12 pour maximiser le reach.",
        })
    elif avg_ht > 20:
        tips.append({
            "tip":    "Réduisez vos hashtags",
            "reason": f"Avec {avg_ht:.0f} hashtags en moyenne, concentrez-vous sur 8 à 12 très pertinents.",
        })
    else:
        tips.append(_GENERIC_CAPTION_TIPS[1])

    # Fill to at least 3 with generic tips
    for gt in _GENERIC_CAPTION_TIPS:
        if len(tips) >= 5:
            break
        if not any(t["tip"] == gt["tip"] for t in tips):
            tips.append(gt)

    return tips[:5]


@router.get("/recommendations/weekly-report")
async def weekly_report(
    current_user: Annotated[object, Depends(get__authenticated_user)],
    company_id: str = Query(...),
    account_id: str | None = Query(None),
):
    """Last-7-days summary vs previous 7 days + best post of the week."""
    try:
        today = date.today()
        curr_from = (today - timedelta(days=6)).isoformat()
        curr_to   = today.isoformat()
        prev_from = (today - timedelta(days=13)).isoformat()
        prev_to   = (today - timedelta(days=7)).isoformat()

        async with httpx.AsyncClient() as client:
            filter_ids = (await _draft_ids_for_account(client, company_id, account_id)) if account_id else None
            curr_rows, prev_rows = await asyncio.gather(
                _metrics_rows(client, company_id, curr_from, curr_to, filter_ids),
                _metrics_rows(client, company_id, prev_from, prev_to, filter_ids),
            )

        curr = _sum_rows(curr_rows)
        prev = _sum_rows(prev_rows)

        def pct(c: int, p: int) -> float | None:
            return round((c - p) / p * 100, 1) if p > 0 else None

        changes = {
            "impressions_pct": pct(curr["impressions"], prev["impressions"]),
            "reach_pct":       pct(curr["reach"],       prev["reach"]),
            "likes_pct":       pct(curr["likes"],       prev["likes"]),
        }

        # Best post of the current week (highest impressions)
        best_post = None
        if curr_rows:
            best_row = max(curr_rows, key=lambda r: r.get("impressions") or 0)
            best_did = best_row.get("draft_id")
            if best_did:
                async with httpx.AsyncClient() as client:
                    dr = await client.get(
                        f"{_base()}/instagram_post_drafts",
                        headers=_rh(),
                        params={"draft_id": f"eq.{best_did}", "select": "caption,content_type"},
                    )
                    if dr.status_code < 400 and isinstance(dr.json(), list) and dr.json():
                        row = dr.json()[0]
                        best_post = {
                            "draft_id":        best_did,
                            "caption":         row.get("caption"),
                            "impressions":     best_row.get("impressions") or 0,
                            "engagement_rate": best_row.get("engagement_rate") or 0,
                        }

        # Field names match TS WeeklyReportData interface
        return ApiResponse(message="Weekly report", data={
            "current_week":  curr,
            "previous_week": prev,
            "changes":       changes,
            "best_post":     best_post,
            "tips":          _GENERIC_WEEKLY_TIPS,
            "date_from":     curr_from,
            "date_to":       curr_to,
        }, http_status=HttpStatus.OK).to_JSON()
    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()
