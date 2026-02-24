"""FastAPI API Gateway - Point d'entrée principal."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health, leads,core

app = FastAPI(
    title="Lynara Campaign API Gateway",
    description="Point d'entrée principal - routage vers core-service et ai-orchestration",
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
app.include_router(leads.router, prefix="/leads", tags=["leads"])
app.include_router(core.router, prefix="/auth", tags=["core"]) 


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "lynara-campaign-api-gateway",
        "message": "API Gateway - Point d'entrée principal",
    }


