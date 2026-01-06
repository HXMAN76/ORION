"""FastAPI application"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from api.routes import ingest, query, manage, image_qa
from config import config

# Create FastAPI app
app = FastAPI(
    title="ORION",
    description="Offline Multimodal RAG System",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Electron app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ingest.router, prefix="/api", tags=["Ingestion"])
app.include_router(query.router, prefix="/api", tags=["Query"])
app.include_router(manage.router, prefix="/api", tags=["Management"])
app.include_router(image_qa.router, prefix="/api", tags=["Image QA"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "ORION",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


# Serve static files if they exist (for development without Electron)
static_dir = Path(__file__).parent.parent.parent / "renderer" / "dist"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
