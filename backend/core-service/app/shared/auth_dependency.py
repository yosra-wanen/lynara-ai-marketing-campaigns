from fastapi import Request, HTTPException
from app.shared.supabase_service import get_supabase
from loguru import logger

client = get_supabase()

def get__authenticated_user(request: Request):
    try:
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(status_code=401, detail="NOT_AUTHENTICATED: Please login to access this resource")
        user = client.auth.get_user(token).user
        logger.info(f"SUCCESSFUL LOGIN: {user.id}")
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"LOGIN FAILED DUE TO THE FOLLOWING ERROR: {e}")
        if "jwt" in str(e).lower() or "token" in str(e).lower():
            raise HTTPException(status_code=401, detail="INVALID_TOKEN: The access token is invalid or has expired, please login again")
        raise HTTPException(status_code=500, detail="SERVER_ERROR: An unexpected error occurred while authenticating the user")