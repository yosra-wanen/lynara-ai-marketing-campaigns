"""FastAPI application - Auth, OCR, Catalogue, Suppliers, logique métier."""
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Routers
from app.api import auth, ocr, catalog, suppliers, company, attributes, advanced

app = FastAPI(
    title="Lynara Campaign Core Service",
    description="Authentification, OCR, Catalogue et logique métier backend",
    version="1.0.0",
)

# Middleware CORS pour le frontend local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(ocr.router, prefix="/ocr", tags=["ocr"])
app.include_router(catalog.router, prefix="/catalog", tags=["catalog"])
app.include_router(suppliers.router, prefix="/catalog/suppliers", tags=["suppliers"])
app.include_router(attributes.router, prefix="/catalog", tags=["attributes"])
app.include_router(advanced.router, prefix="/catalog", tags=["advanced"])
app.include_router(company.router, prefix="/company", tags=["company"])

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "lynara-campaign-core-service",
        "message": "Auth, OCR, Catalogue et logique métier",
    }

@app.get("/health")
async def health():
    """Health check."""
    return {"status": "ok", "service": "lynara-campaign-core-service"}
