"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health, campaigns
from app.api import lead_research
from app.api import instagram_generation

app = FastAPI(
    title="Lynara Campaign AI Orchestration",
    description="Services IA, orchestration, webhooks canaux (Email, WhatsApp, Instagram, Facebook, TikTok)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(campaigns.router, prefix="/campaigns", tags=["campaigns"])
app.include_router(lead_research.router, prefix="/ai-orchestration", tags=["lead-research"])
app.include_router(instagram_generation.router, prefix="/instagram", tags=["instagram-generation"])

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "lynara-campaign-ai-orchestration",
        "message": "API IA - Orchestration des campagnes marketing",
    }
