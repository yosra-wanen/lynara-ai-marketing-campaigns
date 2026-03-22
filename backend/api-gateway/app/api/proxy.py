from fastapi import APIRouter, Request
import httpx
from fastapi.responses import JSONResponse

router = APIRouter()

@router.api_route("/auth/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
async def proxy_to_core(request: Request, path: str):
    \"\"\"Proxy auth requests to core service\"\"\"
    core_url = f"http://localhost:8001/auth/{path}"
    
    # Get request body
    body = await request.body()
    
    # Forward headers (excluding host)
    headers = dict(request.headers)
    headers.pop("host", None)
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.request(
                method=request.method,
                url=core_url,
                headers=headers,
                content=body,
                params=request.query_params
            )
            
            # Return the response from core service
            return JSONResponse(
                content=response.json() if response.content else None,
                status_code=response.status_code,
                headers=dict(response.headers)
            )
        except httpx.RequestError as e:
            return JSONResponse(
                content={"error": f"Core service error: {str(e)}"},
                status_code=503
            )
