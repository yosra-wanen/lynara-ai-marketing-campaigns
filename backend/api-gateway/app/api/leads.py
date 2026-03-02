"""Endpoints Leads - à connecter avec Supabase."""

from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def findAll():
    """List of leads - to be connected with Supabase."""
    return {
        "data": [],
        "message": "Leads endpoint - à connecter avec Supabase",
    }
