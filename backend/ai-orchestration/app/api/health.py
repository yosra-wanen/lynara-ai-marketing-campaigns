"""Health check endpoints."""

from datetime import datetime

from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def health_check():
    """Health check for load balancers and monitoring."""
    return {
        "status": "ok",
        "service": "lynara-campaign-ai-orchestration",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
