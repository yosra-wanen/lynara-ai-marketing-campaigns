from fastapi import Request, HTTPException
from app.shared.supabase_service import get_supabase
from app.shared.api_service import HttpStatus, ApiError

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

        user_response = client.auth.get_user(token)
        if not user_response or not user_response.user:
            return ApiError(
                message="INVALID_TOKEN",
                detail="The access token is invalid or has expired, please login again",
                http_status=HttpStatus.UNAUTHORIZED
            ).to_JSON()

        return user_response.user

    except HTTPException:
        raise
    except Exception as e:
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