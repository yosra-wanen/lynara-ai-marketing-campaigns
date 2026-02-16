"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health, campaigns

app = FastAPI(
    title="Lynara Campaign AI Orchestration",
    description="Services IA, orchestration, webhooks canaux (Email, WhatsApp, Instagram, Facebook, TikTok)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(campaigns.router, prefix="/campaigns", tags=["campaigns"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "lynara-campaign-ai-orchestration",
        "message": "API IA - Orchestration des campagnes marketing",
    }
