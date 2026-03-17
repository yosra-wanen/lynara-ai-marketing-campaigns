"""proxy to core-service."""

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
import httpx

router = APIRouter()

CORE_SERVICE_URL = "http://localhost:8001"


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_to_core(request: Request, path: str):
    """Proxy core service to the appropriate path (map /auth/* -> core /auth/*)."""
    async with httpx.AsyncClient() as client:

        if path.startswith("register/") or path == "register":
            url = f"{CORE_SERVICE_URL}/auth/{path}"
        else:
            url = f"{CORE_SERVICE_URL}/{path}"

        # Forward the request
        response = await client.request(
            method=request.method,
            url=url,
            headers={k: v for k, v in request.headers.items() if k.lower() not in ["host"]},
            params=dict(request.query_params),
            content=await request.body(),
            timeout=30.0,
        )

        return StreamingResponse(
            response.aiter_bytes(),
            status_code=response.status_code,
            headers={k: v for k, v in response.headers.items() if k.lower() != "content-encoding"},
        )