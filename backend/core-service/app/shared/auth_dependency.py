from fastapi import Request, HTTPException
from app.shared.supabase_service import get_supabase

client= get_supabase()

def get__authenticated_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_response=client.auth.get_user(token)
    if not user_response or not user_response.user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user_response.user