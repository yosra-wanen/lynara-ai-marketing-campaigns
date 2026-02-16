"""FastAPI application - Auth, OCR, logique métier."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, ocr

app = FastAPI(
    title="Lynara Campaign Core Service",
    description="Authentification, OCR, et logique métier backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(ocr.router, prefix="/ocr", tags=["ocr"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "lynara-campaign-core-service",
        "message": "Auth, OCR, logique métier",
    }


@app.get("/health")
async def health():
    """Health check."""
    return {"status": "ok", "service": "lynara-campaign-core-service"}
