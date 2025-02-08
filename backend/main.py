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
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import traceback
import datetime

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
        try:
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
        except Exception as e:
            logger.error(f"Error processing request: {str(e)}")
            logger.error(traceback.format_exc())
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"}
            )

app = FastAPI(
    title="Toucan API",
    description="API for Toucan task management",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Debug log before CORS setup
logger.debug("Setting up CORS middleware...")

# Define allowed origins
origins = [
    "https://www.get-toucan.com",
    "https://get-toucan.com",
    "https://toucan.up.railway.app",
    "http://localhost:5173"
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Debug log after CORS setup
logger.debug("CORS middleware setup complete")

# Add request logging middleware
app.add_middleware(RequestLoggingMiddleware)

# Add trusted host middleware last
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # In production, you should restrict this
)

@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    """Additional middleware to ensure CORS headers are present"""
    try:
        # For preflight requests, return immediately
        if request.method == "OPTIONS":
            response = Response(status_code=204)
            origin = request.headers.get("origin")
            if origin and origin in origins:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
                response.headers["Access-Control-Allow-Headers"] = "*"
                response.headers["Access-Control-Max-Age"] = "3600"
            return response

        # For all other requests
        response = await call_next(request)
        
        origin = request.headers.get("origin")
        if origin and origin in origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "*"
            response.headers["Access-Control-Max-Age"] = "3600"
        
        return response
    except Exception as e:
        logger.error(f"Error in CORS middleware: {str(e)}")
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )

# Include routers
app.include_router(auth.router)
app.include_router(tasks.router)

@app.get("/health")
async def health_check():
    """Health check endpoint for Railway"""
    try:
        # Log environment info
        logger.info("Health check requested")
        logger.info(f"Environment: {os.environ.get('ENVIRONMENT', 'unknown')}")
        logger.info(f"Allowed origins: {origins}")
        
        # Return detailed health info
        return {
            "status": "healthy",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "environment": os.environ.get("ENVIRONMENT", "unknown"),
            "allowed_origins": origins
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"status": "unhealthy", "error": str(e)}
        )

@app.get("/")
async def root():
    return {"status": "online"}