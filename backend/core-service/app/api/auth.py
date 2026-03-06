"""Authentication endpoints - Supabase Auth integration."""

import os 
from typing import Annotated
from fastapi import APIRouter, HTTPException, Response, Depends, Request
from pydantic import BaseModel
from app.shared.auth_dependency import get__authenticated_user
from app.shared.supabase_service import get_supabase
router = APIRouter()
client = get_supabase()

class LoginRequest(BaseModel):
    """Connection request."""

    email: str
    password: str


class RegisterRequest(BaseModel):
    """Registration request."""

    email: str
    password: str
    full_name: str = ""
    phone: str = ""

class ForgotPasswordRequest(BaseModel):
    """Forgot password request."""

    email: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class TokenResponse(BaseModel):
    """Response with token."""

    access_token: str
    token_type: str = "bearer"

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest,response: Response):
    """Connection - to connect with Supabase Auth."""
    try:
        result = client.auth.sign_in_with_password({"email": request.email, "password": request.password})
        access_token = result.session.access_token

        # Store the token in an HttpOnly cookie
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,   
            secure=False,
            samesite="lax" # ← protection CSRF
        )

        return TokenResponse(access_token=access_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e)) 
    


@router.post("/register")
async def register(request: RegisterRequest):
    """
    Registration - Create an account in Supabase Auth.
    The on_auth_user_created trigger calls handle_new_user
    which automatically creates the profile in core.profiles.
    """
    try:
        result = client.auth.sign_up(
            {
                "email": request.email,
                "password": request.password,
                "user_metadata": {"full_name": request.full_name, "phone": request.phone},
                "options": {
                    "email_redirect_to": "http://localhost:3000/login"
                }
            }
        )

        return {
            "message": "Account created successfully",
            "user_id": result.user.id,
            "email": result.user.email,
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Forgot password - sends a reset email via Supabase Auth."""
    try:
        client.auth.reset_password_for_email(request.email, {
            "redirect_to": "http://localhost:3000/reset-password"
        })
        return {"message": "Password reset email sent"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.post("/logout")
async def logout(request: Request,response: Response):
    """Logout - removes the access token cookie."""
    try:
        token=request.cookies.get("access_token")
        client.auth.set_session(access_token=token, refresh_token=None)
        client.auth.sign_out()   
    except Exception as e:
        print("Supabase logout error:", str(e))
    
    response.delete_cookie(
        key="access_token",
        path="/",
        secure=False,   
        httponly=True,
        samesite="lax"
    )
    return {"message": "Logged out successfully"}

@router.post("/change-password")
async def change_password(request: Request, request_data: ChangePasswordRequest, current_user: Annotated[dict, Depends(get__authenticated_user)]):
    try:
        try:
            client.auth.sign_in_with_password({
                "email": current_user.email,
                "password": request_data.current_password
            })
        except Exception:
            raise HTTPException(status_code=401, detail="WRONG_PASSWORD")

        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(status_code=401, detail="SESSION_EXPIRED")

        client.auth.set_session(access_token=token, refresh_token=token)

        try:
            client.auth.update_user({"password": request_data.new_password})
        except Exception:
            raise HTTPException(status_code=400, detail="PASSWORD_UPDATE_FAILED")

        return {"message": "Password changed successfully"}

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="SERVER_ERROR")


