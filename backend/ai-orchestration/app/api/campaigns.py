"""Campaign endpoints - Content Studio, orchestration."""

from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def list_campaigns():
    """List campaigns - à connecter avec Celery et Supabase."""
    return {
        "data": [],
        "message": "Campaigns endpoint - pipeline agents IA",
    }
