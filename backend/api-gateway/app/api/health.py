"""Health check endpoint."""

from datetime import datetime

from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def check():
    """Health check pour load balancers et monitoring."""
    return {
        "status": "ok",
        "service": "lynara-campaign-api-gateway",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
