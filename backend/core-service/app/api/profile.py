
import os 
from typing import Annotated, Optional
from fastapi import APIRouter, HTTPException, Response, Depends, Request
from pydantic import BaseModel
from app.shared.auth_dependency import get__authenticated_user
from app.shared.supabase_service import get_supabase
router = APIRouter()
client = get_supabase()

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


@router.get("/me")
async def get_current_user(current_user: Annotated[dict, Depends(get__authenticated_user)]):
    """Get current user - returns the authenticated user's information."""
    try:  
        result = client.schema("core").table("profiles") \
            .select("*") \
            .eq("user_id", current_user.id) \
            .single() \
            .execute()
        

        if not result.data:
            raise HTTPException(status_code=404, detail="Profile not found")

        return result.data

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/me")
async def update_current_user(request: Request,request_data:UpdateProfileRequest,current_user: Annotated[dict, Depends(get__authenticated_user)]):
    try:  
        result = client.rpc("update_user_profile", {
            "p_user_id": current_user.id,
            "p_full_name": request_data.full_name,
            "p_phone": request_data.phone,
            "p_type_user": False,
            }).execute()
        print("RPC result:", result.data)
        if not result.data:
            raise HTTPException(status_code=404, detail="Profile not found")
            
        if request_data.email and request_data.email != current_user.email:
            token = request.cookies.get("access_token")
            print("token:", token)
            session = client.auth.set_session(
                access_token=token,
                refresh_token=token
            )
            print("session:", session)
            response = client.auth.update_user({"email": request_data.email})
            print("update_user response:", response)

        return {"message": "Profile updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))




