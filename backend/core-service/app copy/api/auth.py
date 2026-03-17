"""Endpoints d'authentification - Intégration Supabase Auth."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

router = APIRouter()


class LoginRequest(BaseModel):
    """Requête de connexion."""

    email: str
    password: str


class RegisterRequest(BaseModel):
    """Requête d'inscription."""

    email: str
    password: str


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


@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest):
    """Inscription - à connecter avec Supabase Auth."""
    # TODO: Intégration Supabase Auth
    return TokenResponse(
        access_token="placeholder",
    )


@router.get("/me")
async def get_current_user():
    """Utilisateur courant - à protéger avec JWT/Supabase."""
    # TODO: Validation JWT, récupération user depuis Supabase
    return {"user": "placeholder"}
