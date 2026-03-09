"""
MontgomeryAI - Smart City Dashboard Backend
FastAPI application with RAG-powered AI chatbot and real-time city data.
"""
import app.compat  # noqa: F401  — Python 3.14+ compatibility patches (must be first)
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import router

import logging
import sys
import traceback

# Configure verbose logging to console only (for serverless compatibility)
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Enhanced Civic Dashboard for the City of Montgomery, Alabama",
)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting MontgomeryAI Backend with verbose logging enabled.")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error", "detail": str(exc)},
    )

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix=settings.API_PREFIX)


@app.get("/")
async def root():
    return {
        "message": "🏛️ Welcome to MontgomeryAI - Smart City Dashboard API",
        "docs": "/docs",
        "api": settings.API_PREFIX,
    }
