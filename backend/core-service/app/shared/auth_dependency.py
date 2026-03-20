from fastapi import Request, HTTPException
from app.shared.supabase_service import get_supabase
from app.models.api_models import HttpStatus, ApiError
from loguru import logger

client = get_supabase()

def get__authenticated_user(request: Request):
    try:
        token = request.cookies.get("access_token")
        if not token:
            return ApiError(
                message="NOT_AUTHENTICATED",
                detail="Please login to access this resource",
                http_status=HttpStatus.UNAUTHORIZED
            ).to_JSON()
        user= client.auth.get_user(token).user
        logger.info(f"SUCCESSFUL LOGIN: {user.id}")
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"LOGIN FAILED DUE TO THE FOLLOWING ERROR: {e}")
        if "jwt" in str(e).lower() or "token" in str(e).lower() :
            return ApiError(
                message="INVALID_TOKEN",
                detail="The access token is invalid or has expired, please login again",
                http_status=HttpStatus.UNAUTHORIZED
            ).to_JSON()

        return ApiError(
            message="SERVER_ERROR",
            detail="An unexpected error occurred while authenticating the user",
            http_status=HttpStatus.SERVER_ERROR
        ).to_JSON()