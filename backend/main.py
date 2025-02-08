from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routers import auth, tasks
import os
import logging
import sys
from dotenv import load_dotenv

# Configure logging to output to stdout with more detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s - %(pathname)s:%(lineno)d',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI()

# List of allowed origins
ALLOWED_ORIGINS = [
    "https://www.get-toucan.com",  # Production with www
    "https://get-toucan.com",      # Production without www
    "https://toucan.up.railway.app",  # Railway domain
    "http://localhost:5173"        # Development
]

logger.info("Starting FastAPI application...")
logger.info(f"Configured allowed origins: {ALLOWED_ORIGINS}")

@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    origin = request.headers.get("origin", "")
    logger.info(f"Incoming request from origin: {origin}")
    logger.info(f"Request method: {request.method}")
    logger.info(f"Request headers: {dict(request.headers)}")

    # Handle preflight requests
    if request.method == "OPTIONS":
        response = Response()
        if origin in ALLOWED_ORIGINS:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, HEAD"
            response.headers["Access-Control-Allow-Headers"] = "*"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Max-Age"] = "3600"  # Cache preflight for 1 hour
            logger.info(f"Preflight response headers: {dict(response.headers)}")
        else:
            logger.warning(f"Rejected preflight request from unauthorized origin: {origin}")
        return response

    # Handle actual requests
    response = await call_next(request)
    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, HEAD"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        logger.info(f"Response headers: {dict(response.headers)}")
    else:
        logger.warning(f"Rejected request from unauthorized origin: {origin}")
    
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