"""Endpoints Leads - à connecter avec Supabase."""

from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def findAll():
    """Liste des leads - à connecter avec Supabase."""
    return {
        "data": [],
        "message": "Leads endpoint - à connecter avec Supabase",
    }
