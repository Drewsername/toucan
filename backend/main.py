from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routers import auth, tasks
import os
import logging
import sys
from dotenv import load_dotenv
from starlette.middleware.base import BaseHTTPMiddleware
import json

# Configure logging to output to stdout with more detailed format
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s - %(pathname)s:%(lineno)d',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

load_dotenv()

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Log request details
        logger.debug(f"Request: {request.method} {request.url}")
        logger.debug(f"Client Host: {request.client.host if request.client else 'Unknown'}")
        logger.debug(f"Headers: {dict(request.headers)}")

        # Process the request and get response
        response = await call_next(request)

        # Log response details
        logger.debug(f"Response Status: {response.status_code}")
        logger.debug(f"Response Headers: {dict(response.headers)}")

        return response

app = FastAPI()

# Add request logging middleware
app.add_middleware(RequestLoggingMiddleware)

# Debug log before CORS setup
logger.debug("Setting up CORS middleware...")

# Define default origins
DEFAULT_ORIGINS = [
    "https://www.get-toucan.com",
    "https://get-toucan.com",
    "https://toucan.up.railway.app",
    "http://localhost:5173"
]

# Get allowed origins from environment variable or use defaults
allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
allowed_origins = [origin.strip() for origin in allowed_origins if origin.strip()]

if not allowed_origins:
    allowed_origins = DEFAULT_ORIGINS

logger.debug(f"Configured allowed origins: {allowed_origins}")

# Add CORS middleware to the application
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Debug log after CORS setup
logger.debug("CORS middleware setup complete")

@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    """Additional middleware to ensure CORS headers are present"""
    response = await call_next(request)
    
    origin = request.headers.get("origin")
    if origin and origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "*"
    
    return response

# Include routers
app.include_router(auth.router)
app.include_router(tasks.router)

@app.get("/health")
async def health_check():
    """Health check endpoint for Railway"""
    return {"status": "healthy"}

@app.get("/")
async def root():
    return {"status": "online"}