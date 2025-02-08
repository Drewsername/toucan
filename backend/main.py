from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from routers import auth, tasks
import os
import logging
import sys
from dotenv import load_dotenv
import traceback
import datetime
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        if os.environ.get("ENVIRONMENT") == "production":
            if request.url.scheme == "http":
                https_url = str(request.url).replace("http://", "https://", 1)
                return RedirectResponse(https_url, status_code=301)
        return await call_next(request)

# Create FastAPI app instance
app = FastAPI()

# Add HTTPS redirect middleware in production
app.add_middleware(HTTPSRedirectMiddleware)

# Define allowed origins
origins = [
    "https://www.get-toucan.com",
    "https://get-toucan.com",
    "https://backend.get-toucan.com",
    "https://api.get-toucan.com",
    "https://*.get-toucan.com",  # Allow all subdomains
    "https://toucan.up.railway.app",
    "http://localhost:5173",
    # Allow internal Railway DNS
    "http://toucan.railway.internal",
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(tasks.router)

@app.get("/health")
async def health_check():
    """Health check endpoint for Railway"""
    try:
        return {
            "status": "healthy",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "environment": os.environ.get("ENVIRONMENT", "unknown"),
            "allowed_origins": origins
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"status": "unhealthy", "error": str(e)}
        )

@app.get("/")
async def root():
    return {"status": "online"}