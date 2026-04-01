from cryptography.fernet import Fernet
import os

from fastapi import HTTPException
from app.models.http_status_enum import HttpStatus

FERNET_KEY = os.getenv("FERNET_SECRET_KEY")

if not FERNET_KEY:
    raise HTTPException(
        status_code=HttpStatus.SERVER_ERROR.value,
        detail="FERNET_SECRET_KEY is not set in environment variables"
    )

fernet = Fernet(FERNET_KEY.encode() if isinstance(FERNET_KEY, str) else FERNET_KEY)


def encrypt_key(raw_key: str) -> str:
    """Chiffre une clé API en clair → retourne une string base64 chiffrée."""
    return fernet.encrypt(raw_key.encode()).decode()


def decrypt_key(encrypted_key: str) -> str:
    """Déchiffre une clé API chiffrée → retourne la clé en clair."""
    return fernet.decrypt(encrypted_key.encode()).decode()