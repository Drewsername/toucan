from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routers import auth, tasks
import os
import logging
import sys
from dotenv import load_dotenv
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.middleware.cors import CORSMiddleware
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

# Get allowed origins from environment variable, fallback to default if not set
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "https://www.get-toucan.com,https://get-toucan.com,https://toucan.up.railway.app,http://localhost:5173")
allowed_origins = [origin.strip() for origin in ALLOWED_ORIGINS.split(",")]
logger.debug(f"Configured allowed origins: {allowed_origins}")

# Add CORS middleware to the application
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Temporarily allow all origins for debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Debug log after CORS setup
logger.debug("CORS middleware setup complete")

@app.options("/{full_path:path}")
async def options_route(request: Request, full_path: str):
    """Handle OPTIONS requests explicitly for debugging"""
    logger.debug(f"OPTIONS request received for path: /{full_path}")
    logger.debug(f"Request headers: {dict(request.headers)}")
    
    origin = request.headers.get("origin")
    logger.debug(f"Origin header: {origin}")
    
    # Return response with CORS headers
    response = Response()
    response.headers["Access-Control-Allow-Origin"] = origin or "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    
    logger.debug(f"Response headers: {dict(response.headers)}")
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