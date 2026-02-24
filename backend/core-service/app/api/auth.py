"""Endpoints d'authentification - Intégration Supabase Auth."""

import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client

router = APIRouter()


def get_supabase():
    """Creates and returns a Supabase client with the key service_role."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise HTTPException(
            status_code=500,
            detail="Missing Supabase configuration (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)",
        )
    return create_client(url, key)


class LoginRequest(BaseModel):
    """Requête de connexion."""

    email: str
    password: str


class RegisterRequest(BaseModel):
    """Requête d'inscription."""

    email: str
    password: str
    full_name: str = ""
    phone: str = ""


class TokenResponse(BaseModel):
    """Réponse avec token."""

    access_token: str
    token_type: str = "bearer"


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Connexion - à connecter avec Supabase Auth."""
    # TODO: Intégration Supabase Auth
    # from supabase import create_client
    # supabase.auth.sign_in_with_password({"email": request.email, "password": request.password})
    return TokenResponse(
        access_token="placeholder",
    )


@router.post("/register")
async def register(request: RegisterRequest):
    """
    Registration - Create an account in Supabase Auth.
    The on_auth_user_created trigger calls handle_new_user
    which automatically creates the profile in core.profiles.
    """
    try:
        supabase = get_supabase()

        result = supabase.auth.sign_up(
            {
                "email": request.email,
                "password": request.password,
                "user_metadata": {"full_name": request.full_name, "phone": request.phone},
            }
        )

        return {
            "message": "Account created successfully",
            "user_id": result.user.id,
            "email": result.user.email,
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/me")
async def get_current_user():
    """Utilisateur courant - à protéger avec JWT/Supabase."""
    # TODO: Validation JWT, récupération user depuis Supabase
    return {"user": "placeholder"}