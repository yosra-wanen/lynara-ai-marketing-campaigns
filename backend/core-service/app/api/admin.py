"""Admin endpoints — platform management (admin-only)."""

import json
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request

from app.models.api_models import ApiError, ApiResponse
from app.models.http_status_enum import HttpStatus
from app.shared.auth_dependency import get__authenticated_user
from app.shared.supabase_service import get_supabase

router = APIRouter()
client = get_supabase()


# ─── Admin guard ─────────────────────────────────────────────────────────────

def require_admin(current_user: Annotated[object, Depends(get__authenticated_user)]):
    """Verify the current user has is_admin = true in core.profiles."""
    result = (
        client.schema("core")
        .table("profiles")
        .select("is_admin")
        .eq("user_id", str(current_user.id))
        .single()
        .execute()
    )
    if not result.data or not result.data.get("is_admin"):
        raise HTTPException(status_code=403, detail="FORBIDDEN: Admin access required")
    return current_user


def _log(action: str, performed_by: str, target_user: str | None = None, details: dict | None = None):
    try:
        client.table("admin_logs").insert({
            "action":       action,
            "target_user":  target_user,
            "performed_by": performed_by,
            "details":      details or {},
        }).execute()
    except Exception:
        pass  # Never let logging break an endpoint


# ─── Users ───────────────────────────────────────────────────────────────────

@router.get("/users")
async def list_users(admin: Annotated[object, Depends(require_admin)]):
    try:
        response = client.auth.admin.list_users()
        auth_users = response if isinstance(response, list) else getattr(response, "users", [])

        profiles_res = (
            client.schema("core")
            .table("profiles")
            .select("user_id, full_name, is_admin")
            .execute()
        )
        profiles_map = {p["user_id"]: p for p in (profiles_res.data or [])}

        users = []
        for u in auth_users:
            uid = str(u.id)
            profile = profiles_map.get(uid, {})
            banned_until = getattr(u, "banned_until", None)
            users.append({
                "id":         uid,
                "email":      u.email or "",
                "full_name":  profile.get("full_name") or (u.user_metadata or {}).get("full_name", ""),
                "role":       "admin" if profile.get("is_admin") else "user",
                "status":     "banned" if banned_until else "active",
                "created_at": str(u.created_at) if u.created_at else "",
            })

        return ApiResponse(message="Users fetched", data=users, http_status=HttpStatus.OK).to_JSON()

    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    request: Request,
    admin:   Annotated[object, Depends(require_admin)],
):
    try:
        body = await request.json()
        role = body.get("role", "user")
        if role not in ("admin", "user"):
            raise HTTPException(status_code=400, detail="INVALID_ROLE")

        client.schema("core").table("profiles").update({"is_admin": role == "admin"}).eq("user_id", user_id).execute()
        _log(f"ROLE_CHANGE:{role.upper()}", str(admin.id), target_user=user_id, details={"new_role": role})

        return ApiResponse(message="Role updated", http_status=HttpStatus.OK).to_JSON()

    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


@router.put("/users/{user_id}/ban")
async def toggle_ban_user(
    user_id: str,
    request: Request,
    admin:   Annotated[object, Depends(require_admin)],
):
    try:
        body    = await request.json()
        banned  = body.get("banned", True)
        duration = "876600h" if banned else "none"

        client.auth.admin.update_user_by_id(user_id, {"ban_duration": duration})
        _log("BAN" if banned else "UNBAN", str(admin.id), target_user=user_id)

        return ApiResponse(
            message="User banned" if banned else "User unbanned",
            http_status=HttpStatus.OK,
        ).to_JSON()

    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: Annotated[object, Depends(require_admin)]):
    try:
        client.auth.admin.delete_user(user_id)
        _log("DELETE_USER", str(admin.id), target_user=user_id)

        return ApiResponse(message="User deleted", http_status=HttpStatus.OK).to_JSON()

    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


# ─── Campaigns (catalog items) ───────────────────────────────────────────────

@router.get("/campaigns")
async def list_campaigns(admin: Annotated[object, Depends(require_admin)]):
    try:
        result = (
            client.schema("catalog")
            .table("items")
            .select("id, title_fr, status, company_id, created_at, created_by, currency, price")
            .order("created_at", desc=True)
            .execute()
        )
        items = result.data or []

        company_ids = list({i["company_id"] for i in items if i.get("company_id")})
        companies_map: dict = {}
        if company_ids:
            companies_res = (
                client.schema("core")
                .table("companies")
                .select("company_id, legal_name")
                .in_("company_id", company_ids)
                .execute()
            )
            companies_map = {c["company_id"]: c["legal_name"] for c in (companies_res.data or [])}

        for item in items:
            item["company_name"] = companies_map.get(item.get("company_id", ""), "")

        return ApiResponse(message="Campaigns fetched", data=items, http_status=HttpStatus.OK).to_JSON()

    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


@router.put("/campaigns/{campaign_id}/deactivate")
async def deactivate_campaign(campaign_id: str, admin: Annotated[object, Depends(require_admin)]):
    try:
        client.schema("catalog").table("items").update({"status": "archived"}).eq("id", campaign_id).execute()
        _log("DEACTIVATE_CAMPAIGN", str(admin.id), details={"campaign_id": campaign_id})

        return ApiResponse(message="Campaign deactivated", http_status=HttpStatus.OK).to_JSON()

    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


@router.delete("/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: str, admin: Annotated[object, Depends(require_admin)]):
    try:
        client.schema("catalog").table("items").delete().eq("id", campaign_id).execute()
        _log("DELETE_CAMPAIGN", str(admin.id), details={"campaign_id": campaign_id})

        return ApiResponse(message="Campaign deleted", http_status=HttpStatus.OK).to_JSON()

    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


# ─── Instagram accounts ───────────────────────────────────────────────────────

@router.get("/instagram")
async def list_instagram_accounts(admin: Annotated[object, Depends(require_admin)]):
    try:
        result = client.table("instagram_accounts").select("*").execute()
        accounts = result.data or []

        user_ids = list({a["user_id"] for a in accounts if a.get("user_id")})
        profiles_map: dict = {}
        if user_ids:
            profiles_res = (
                client.schema("core")
                .table("profiles")
                .select("user_id, full_name, email")
                .in_("user_id", user_ids)
                .execute()
            )
            profiles_map = {p["user_id"]: p for p in (profiles_res.data or [])}

        for acct in accounts:
            profile = profiles_map.get(acct.get("user_id", ""), {})
            acct["owner_name"]  = profile.get("full_name", "")
            acct["owner_email"] = profile.get("email", "")

        return ApiResponse(message="Instagram accounts fetched", data=accounts, http_status=HttpStatus.OK).to_JSON()

    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


@router.delete("/instagram/{account_id}")
async def disconnect_instagram(account_id: str, admin: Annotated[object, Depends(require_admin)]):
    try:
        client.table("instagram_accounts").update({"is_connected": False, "access_token": None}).eq("id", account_id).execute()
        _log("DISCONNECT_INSTAGRAM", str(admin.id), details={"account_id": account_id})

        return ApiResponse(message="Instagram account disconnected", http_status=HttpStatus.OK).to_JSON()

    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


# ─── Analytics ────────────────────────────────────────────────────────────────

@router.get("/analytics")
async def get_analytics(admin: Annotated[object, Depends(require_admin)]):
    try:
        auth_response = client.auth.admin.list_users()
        auth_users    = auth_response if isinstance(auth_response, list) else getattr(auth_response, "users", [])
        total_users   = len(auth_users)

        companies_res  = client.schema("core").table("companies").select("company_id").execute()
        total_companies = len(companies_res.data or [])

        items_res       = client.schema("catalog").table("items").select("id, status, created_at").execute()
        items           = items_res.data or []
        total_campaigns  = len(items)
        active_campaigns = sum(1 for i in items if i.get("status") == "published")

        instagram_res      = client.table("instagram_accounts").select("id").eq("is_connected", True).execute()
        total_instagram    = len(instagram_res.data or [])

        now = datetime.utcnow()
        monthly_users: dict     = {}
        monthly_campaigns: dict = {}
        for offset in range(5, -1, -1):
            month_key = (now - timedelta(days=30 * offset)).strftime("%Y-%m")
            monthly_users[month_key]     = 0
            monthly_campaigns[month_key] = 0

        for u in auth_users:
            raw = getattr(u, "created_at", None)
            if raw:
                month = str(raw)[:7]
                if month in monthly_users:
                    monthly_users[month] += 1

        for item in items:
            raw = item.get("created_at", "")
            if raw:
                month = str(raw)[:7]
                if month in monthly_campaigns:
                    monthly_campaigns[month] += 1

        return ApiResponse(
            message="Analytics fetched",
            data={
                "total_users":       total_users,
                "total_companies":   total_companies,
                "total_campaigns":   total_campaigns,
                "active_campaigns":  active_campaigns,
                "total_instagram":   total_instagram,
                "users_per_month":   [{"month": k, "count": v} for k, v in sorted(monthly_users.items())],
                "campaigns_per_month": [{"month": k, "count": v} for k, v in sorted(monthly_campaigns.items())],
            },
            http_status=HttpStatus.OK,
        ).to_JSON()

    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


# ─── Logs ─────────────────────────────────────────────────────────────────────

@router.get("/logs")
async def get_logs(admin: Annotated[object, Depends(require_admin)]):
    try:
        result = (
            client.table("admin_logs")
            .select("*")
            .order("created_at", desc=True)
            .limit(200)
            .execute()
        )
        return ApiResponse(message="Logs fetched", data=result.data or [], http_status=HttpStatus.OK).to_JSON()

    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


# ─── Settings ─────────────────────────────────────────────────────────────────

@router.get("/settings")
async def get_settings(admin: Annotated[object, Depends(require_admin)]):
    try:
        result   = client.table("settings").select("*").execute()
        settings = {row["key"]: row["value"] for row in (result.data or [])}
        return ApiResponse(message="Settings fetched", data=settings, http_status=HttpStatus.OK).to_JSON()

    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()


@router.put("/settings")
async def update_settings(request: Request, admin: Annotated[object, Depends(require_admin)]):
    try:
        body = await request.json()
        for key, value in body.items():
            serialized = json.dumps(value) if not isinstance(value, str) else json.dumps(value)
            client.table("settings").upsert({
                "key":   key,
                "value": serialized,
            }).execute()

        _log("UPDATE_SETTINGS", str(admin.id), details={"keys": list(body.keys())})
        return ApiResponse(message="Settings updated", http_status=HttpStatus.OK).to_JSON()

    except HTTPException:
        raise
    except Exception as e:
        return ApiError(message="SERVER_ERROR", detail=str(e), http_status=HttpStatus.SERVER_ERROR).to_JSON()
